// Etapa 234 — resiliência de bitrix-api com o Bitrix fora do ar.
// Prova o mapeamento de falha (retry -> 502, timeout -> 504, corpo inválido -> 503)
// e a degradação graciosa do get_user, que nunca derruba o Inbox inteiro.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chamadasDe, comBackendFalso, escritasDeNegocio, type Registro } from "../../_shared/testing/backend-falso.ts";
import { resetCircuit } from "../../_shared/resilience.ts";

Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-key-de-teste");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");
Deno.env.set("BITRIX_WEBHOOK_URL", "https://edge-234.bitrix24.com.br/rest/1/token-de-teste/");

const { handler } = await import("../index.ts");

const URL_FN = "https://mock.supabase.co/functions/v1/bitrix-api";
const HOST = "edge-234.bitrix24.com.br";

function pedido(action: string): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token-de-teste" },
    body: JSON.stringify({ action, params: {} }),
  });
}

async function chamaBitrix(
  action: string,
  falha: {
    tipo?: "timeout" | "abort" | "corpo-invalido";
    status?: number;
    body?: unknown;
    headers?: Record<string, string>;
  },
) {
  resetCircuit("bitrix-api");
  return await comBackendFalso(
    { falhas: [{ contem: HOST, ...falha }] },
    async (registro: Registro[]) => {
      const resp = await handler(pedido(action));
      const body = await resp.json();
      return { resp, body, registro };
    },
  );
}

Deno.test("bitrix-api: caminho feliz devolve os contatos", async () => {
  const { resp, body, registro } = await chamaBitrix("get_contacts", {
    status: 200,
    body: { result: [{ ID: "1", NAME: "Ana" }], total: 1 },
  });
  assertEquals(resp.status, 200);
  assertEquals(body.success, true);
  assertEquals(body.total, 1);
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("bitrix-api: 500 do Bitrix e reenviado 2x e termina em 502", async () => {
  const { resp, body, registro } = await chamaBitrix("get_contacts", { status: 500, body: { error: "boom" } });
  assertEquals(resp.status, 502);
  assertEquals(body.error, "Não foi possível conectar ao Bitrix");
  assertEquals(chamadasDe(registro, HOST).length, 3, "1 tentativa + 2 reenvios");
});

Deno.test("bitrix-api: 429 do Bitrix e tratado como indisponibilidade (502)", async () => {
  const { resp, body } = await chamaBitrix("get_contacts", {
    status: 429,
    body: { error: "rate limited" },
    headers: { "Retry-After": "30" },
  });
  assertEquals(resp.status, 502);
  assertEquals(body.error, "Não foi possível conectar ao Bitrix");
});

Deno.test("bitrix-api: timeout do Bitrix vira 504", async () => {
  const { resp, body, registro } = await chamaBitrix("get_contacts", { tipo: "abort" });
  assertEquals(resp.status, 504);
  assertEquals(body.error, "Tempo limite de conexão com Bitrix excedido");
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
});

Deno.test("bitrix-api: resposta nao-JSON do Bitrix vira 503 de configuracao", async () => {
  const { resp, body, registro } = await chamaBitrix("get_contacts", { tipo: "corpo-invalido" });
  assertEquals(resp.status, 503);
  assertEquals(body.error, "Configuração inválida do webhook");
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("bitrix-api: get_user degrada para configured=false em vez de derrubar a tela", async () => {
  const { resp, body } = await chamaBitrix("get_user", { status: 500, body: { error: "boom" } });
  assertEquals(resp.status, 200);
  assertEquals(body.configured, false);
  assert(String(body.message).length > 0);
});