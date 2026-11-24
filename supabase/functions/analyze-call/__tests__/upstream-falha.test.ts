// Etapa 234 — resiliência de analyze-call com o provedor de IA fora do ar.
// Prova que timeout vira 503 AI_UNAVAILABLE, 4xx/5xx vira 503 AI_SERVICE_UNAVAILABLE
// e corpo quebrado vira 500 INTERNAL_ERROR — sempre sem gravar nada.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chamadasDe, comBackendFalso, escritasDeNegocio, type Registro } from "../../_shared/testing/backend-falso.ts";

Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-key-de-teste");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");
Deno.env.set("OPENROUTER_API_KEY", "or-key-de-teste");

const { handler } = await import("../index.ts");

const URL_FN = "https://mock.supabase.co/functions/v1/analyze-call";

const analise = {
  summary: "Cliente pediu upgrade e ficou satisfeito.",
  sentiment: "positive",
  sentimentScore: 85,
  keyTopics: ["upgrade"],
  actionItems: ["enviar proposta"],
  customerSatisfaction: 90,
  agentPerformance: { clarity: 88, empathy: 92, resolution: 80 },
};

function pedido(): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token-de-teste" },
    body: JSON.stringify({
      transcript: "Cliente: quero fazer upgrade do plano. Agente: claro, vou verificar.",
      callInfo: { contactName: "Ana", duration: "02:30", type: "inbound" },
    }),
  });
}

async function chamaComIa(falha: {
  tipo?: "timeout" | "corpo-invalido";
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}) {
  return await comBackendFalso(
    { falhas: [{ contem: "openrouter.ai", ...falha }] },
    async (registro: Registro[]) => {
      const resp = await handler(pedido());
      const body = await resp.json();
      return { resp, body, registro };
    },
  );
}

Deno.test("analyze-call: caminho feliz devolve a analise estruturada", async () => {
  const { resp, body, registro } = await chamaComIa({
    status: 200,
    body: { choices: [{ message: { content: JSON.stringify(analise) } }] },
  });
  assertEquals(resp.status, 200);
  assertEquals(body.sentiment, "positive");
  assertEquals(body.customerSatisfaction, 90);
  assertEquals(body.version, "v1");
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("analyze-call: IA sem prazo devolve 503 AI_UNAVAILABLE sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComIa({ tipo: "timeout" });
  assertEquals(resp.status, 503);
  assertEquals(body.code, "AI_UNAVAILABLE");
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
  assertEquals(chamadasDe(registro, "openrouter.ai").length, 1);
});

Deno.test("analyze-call: 500 do provedor devolve 503 AI_SERVICE_UNAVAILABLE", async () => {
  const { resp, body, registro } = await chamaComIa({ status: 500, body: { error: "boom" } });
  assertEquals(resp.status, 503);
  assertEquals(body.code, "AI_SERVICE_UNAVAILABLE");
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("analyze-call: 429 do provedor devolve 503 AI_SERVICE_UNAVAILABLE", async () => {
  const { resp, body, registro } = await chamaComIa({
    status: 429,
    body: { error: "rate limited" },
    headers: { "Retry-After": "30" },
  });
  assertEquals(resp.status, 503);
  assertEquals(body.code, "AI_SERVICE_UNAVAILABLE");
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("analyze-call: corpo invalido do provedor devolve 500 INTERNAL_ERROR", async () => {
  const { resp, body, registro } = await chamaComIa({ tipo: "corpo-invalido" });
  assertEquals(resp.status, 500);
  assertEquals(body.code, "INTERNAL_ERROR");
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
});