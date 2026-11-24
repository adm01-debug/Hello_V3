// Etapa 234 — resiliência de chatbot-respond com o provedor de IA fora do ar.
// Prova que timeout, 429 e 5xx do OpenRouter viram 503 sem gravar mensagem pela metade.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chamadasDe, comBackendFalso, escritasDeNegocio, type Registro } from "../../_shared/testing/backend-falso.ts";

Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-key-de-teste");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");
Deno.env.set("OPENROUTER_API_KEY", "or-key-de-teste");

const { handler } = await import("../index.ts");

const URL_FN = "https://mock.supabase.co/functions/v1/chatbot-respond";
const CONVERSA = "11111111-2222-3333-4444-555555555555";

const tabelas = {
  chat_sessions: { body: { visitor_token: "tok-1", conversation_id: CONVERSA } },
  kb_articles: { body: [] },
  system_settings: { body: { value: "0.7" } },
  conversations: { body: { handoff_threshold: null } },
};

function pedido(): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: CONVERSA,
      user_message: "Como faco upgrade do meu plano?",
      visitor_token: "tok-1",
    }),
  });
}

const respostaIa = {
  choices: [
    {
      message: {
        tool_calls: [
          {
            function: {
              name: "respond_to_user",
              arguments: JSON.stringify({
                response: "Para fazer upgrade acesse Configuracoes > Plano.",
                intent: "info_produto",
                confidence: 0.9,
                handoff: false,
              }),
            },
          },
        ],
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
    { tabelas, falhas: [{ contem: "openrouter.ai", ...falha }] },
    async (registro: Registro[]) => {
      const resp = await handler(pedido());
      const body = await resp.json();
      return { resp, body, registro };
    },
  );
}

Deno.test("chatbot-respond: caminho feliz responde ao visitante e grava a mensagem", async () => {
  const { resp, body, registro } = await chamaComIa({ status: 200, body: respostaIa });
  assertEquals(resp.status, 200);
  assertEquals(body.intent, "info_produto");
  assertEquals(body.handoff, false);
  assert(String(body.response).includes("upgrade"));
  const gravacoes = escritasDeNegocio(registro);
  assertEquals(gravacoes.length, 2, "mensagem do bot + auditoria");
  assert(gravacoes.some((g) => g.url.includes("/conversation_messages")), "gravou a mensagem do bot");
});

Deno.test("chatbot-respond: IA sem prazo devolve 503 sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComIa({ tipo: "timeout" });
  assertEquals(resp.status, 503);
  assertEquals(body.error, "Serviço de IA indisponível");
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
  assertEquals(chamadasDe(registro, "openrouter.ai").length, 1);
});

Deno.test("chatbot-respond: 429 do provedor devolve 503 sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComIa({
    status: 429,
    body: { error: "rate limited" },
    headers: { "Retry-After": "30" },
  });
  assertEquals(resp.status, 503);
  assertEquals(body.error, "Serviço de IA indisponível");
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("chatbot-respond: 500 do provedor devolve 503 sem gravar nada", async () => {
  const { resp, registro } = await chamaComIa({ status: 500, body: { error: "boom" } });
  assertEquals(resp.status, 503);
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("chatbot-respond: corpo invalido do provedor devolve 5xx sem gravar nada", async () => {
  const { resp, registro } = await chamaComIa({ tipo: "corpo-invalido" });
  assert(resp.status >= 500 && resp.status < 600, `esperava 5xx, veio ${resp.status}`);
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
});