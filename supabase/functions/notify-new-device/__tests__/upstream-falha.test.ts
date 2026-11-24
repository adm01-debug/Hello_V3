// Etapa 234 — resiliência de notify-new-device com o Resend fora do ar.
// Simula timeout, 429 com Retry-After, 500 e corpo inválido no terceiro e afirma
// que a edge responde erro (5xx) sem gravar nada pela metade.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chamadasDe, comBackendFalso, escritasDeNegocio, type Registro } from "../../_shared/testing/backend-falso.ts";

Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-key-de-teste");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");
Deno.env.set("RESEND_API_KEY", "re-key-de-teste");
Deno.env.set("FROM_EMAIL", "seguranca@exemplo.com");

const { handler } = await import("../index.ts");

const URL_FN = "https://mock.supabase.co/functions/v1/notify-new-device";

const corpoValido = {
  ip: "203.0.113.10",
  country: "Brasil",
  city: "São Paulo",
  browser: "Chrome",
  os: "Windows",
  device: "Desktop",
  timestamp: "2026-11-24T12:00:00.000Z",
  isNewIP: true,
  isNewBrowser: true,
};

function pedido(): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token-de-teste" },
    body: JSON.stringify(corpoValido),
  });
}

async function chamaComResend(falha: { tipo?: "timeout" | "corpo-invalido"; status?: number; headers?: Record<string, string>; body?: unknown }) {
  return await comBackendFalso({ falhas: [{ contem: "api.resend.com", ...falha }] }, async (registro: Registro[]) => {
    const resp = await handler(pedido());
    const body = await resp.json();
    return { resp, body, registro };
  });
}

function assinaErroSemEscrita(resp: Response, body: Record<string, unknown>, registro: Registro[]) {
  assert(resp.status >= 500 && resp.status < 600, `esperava 5xx, veio ${resp.status}`);
  assertEquals(body.emailSent, false);
  assertEquals(escritasDeNegocio(registro).length, 0, "nao pode gravar pela metade");
  assertEquals(chamadasDe(registro, "api.resend.com").length, 1, "o terceiro foi chamado uma vez");
}

Deno.test("notify-new-device: caminho feliz envia o e-mail e nao grava no banco", async () => {
  const { resp, body, registro } = await chamaComResend({ status: 200, body: { id: "em_1" } });
  assertEquals(resp.status, 200);
  assertEquals(body.emailSent, true);
  assertEquals(body.emailId, "em_1");
  assertEquals(escritasDeNegocio(registro).length, 0);
});

Deno.test("notify-new-device: timeout do Resend devolve 5xx sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComResend({ tipo: "timeout" });
  assinaErroSemEscrita(resp, body, registro);
});

Deno.test("notify-new-device: 429 do Resend devolve 5xx sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComResend({
    status: 429,
    body: { message: "rate limited" },
    headers: { "Retry-After": "30" },
  });
  assinaErroSemEscrita(resp, body, registro);
});

Deno.test("notify-new-device: 500 do Resend devolve 5xx sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComResend({ status: 500, body: { message: "boom" } });
  assinaErroSemEscrita(resp, body, registro);
});

Deno.test("notify-new-device: corpo invalido do Resend devolve 5xx sem gravar nada", async () => {
  const { resp, body, registro } = await chamaComResend({ tipo: "corpo-invalido" });
  assinaErroSemEscrita(resp, body, registro);
});