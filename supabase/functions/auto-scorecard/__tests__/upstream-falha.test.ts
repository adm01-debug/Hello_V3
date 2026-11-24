// Etapa 234 — resiliência de auto-scorecard com o provedor de IA fora do ar.
// Prova que timeout/429/5xx viram 503 e que nenhum scorecard fica gravado pela metade.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chamadasDe, comBackendFalso, escritasDeNegocio, type Registro } from "../../_shared/testing/backend-falso.ts";

Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-key-de-teste");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");
Deno.env.set("OPENROUTER_API_KEY", "or-key-de-teste");

const { handler } = await import("../index.ts");

const URL_FN = "https://mock.supabase.co/functions/v1/auto-scorecard";
const SESSAO = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const insercoes = { call_scorecards: { id: "sc-1" } };

const tabelas = {
  call_scorecards: { body: null },
  call_sessions: {
    body: {
      id: SESSAO,
      agent_name: "Ana",
      duration_seconds: 120,
      call_summaries: [{ summary: "Cliente pediu upgrade e reclamou do prazo." }],
    },
  },
  scorecard_templates: { body: { id: "tpl-1", name: "Padrao" } },
  scorecard_criteria: {
    body: [{ id: "crit-1", label: "Empatia", description: null, weight: 1, max_score: 10 }],
  },
};

function pedido(): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_session_id: SESSAO }),
  });
}

const respostaIa = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          scores: [{ criterion_id: "crit-1", score: 8, comment: "Tom cordial" }],
          feedback: "Boa conducao da chamada.",
        }),
      },
    },
  ],
};

async function chamaComIa(falha: {
  tipo?: "timeout" | "corpo-invalido";
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  return await comBackendFalso(
    { tabelas, insercoes, falhas: [{ contem: "openrouter.ai", ...falha }] },
    async (registro: Registro[]) => {
      const resp = await handler(pedido());
      const body = await resp.json();
      return { resp, body, registro };
    },
  );
}

Deno.test("auto-scorecard: caminho feliz grava scorecard e respostas", async () => {
  const { resp, body, registro } = await chamaComIa({ status: 200, body: respostaIa });
  assertEquals(resp.status, 200);
  assertEquals(body.status, "created");
  assertEquals(body.scorecard_id, "sc-1");
  const gravacoes = escritasDeNegocio(registro);
  assert(gravacoes.some((g) => g.url.includes("/call_scorecards")), "gravou o scorecard");
  assert(gravacoes.some((g) => g.url.includes("/scorecard_responses")), "gravou as respostas");
});

Deno.test("auto-scorecard: IA sem prazo devolve 503 sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComIa({ tipo: "timeout" });
  assertEquals(resp.status, 503);
  assertEquals(body.error, "Serviço de IA indisponível");
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
  assertEquals(chamadasDe(registro, "openrouter.ai").length, 1);
});

Deno.test("auto-scorecard: 429 do provedor devolve 503 sem gravar nada", async () => {
  const { resp, registro } = await chamaComIa({
    status: 429,
    body: { error: "rate limited" },
    headers: { "Retry-After": "30" },
  });
  assertEquals(resp.status, 503);
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("auto-scorecard: 500 do provedor devolve 503 sem gravar nada", async () => {
  const { resp, registro } = await chamaComIa({ status: 500, body: { error: "boom" } });
  assertEquals(resp.status, 503);
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("auto-scorecard: corpo invalido do provedor devolve 5xx sem gravar nada", async () => {
  const { resp, registro } = await chamaComIa({ tipo: "corpo-invalido" });
  assert(resp.status >= 500 && resp.status < 600, `esperava 5xx, veio ${resp.status}`);
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
});