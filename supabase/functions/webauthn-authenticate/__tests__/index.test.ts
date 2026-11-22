// Testes da edge webauthn-authenticate: fail-closed em assercao.
// A edge consulta a passkey pela credential_id (dono derivado, nunca do
// body). Com a service role apontando para a porta 9 (discard), a consulta
// falha e a edge deve recusar com 400 - nunca emitir magic link.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { capturarHandler } from "../../_shared/__tests__/capture-handler.ts";

Deno.env.set("SUPABASE_URL", "http://127.0.0.1:9");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key-de-teste");

const handler = await capturarHandler(() => import("../index.ts"));
const URL_FN = "http://localhost/functions/v1/webauthn-authenticate";

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("webauthn-authenticate: OPTIONS devolve preflight CORS vazio", async () => {
  const res = await handler(
    new Request(URL_FN, {
      method: "OPTIONS",
      headers: { Origin: "https://hello-v3.vercel.app" },
    }),
  );
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "");
  assert(res.headers.get("access-control-allow-origin") !== null);
});

Deno.test("webauthn-authenticate: sem campos obrigatorios responde 400", async () => {
  const res = await handler(post({}));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "Missing required fields");
});

Deno.test("webauthn-authenticate: nao aceita email do request", async () => {
  // A edge e publica; o e-mail vem do dono da passkey, nunca do body.
  const res = await handler(post({
    credentialId: "cred-1",
    clientDataJSON: "x",
    authenticatorData: "y",
    signature: "z",
    email: "atacante@x.com",
    userId: "outro-usuario",
  }));
  // DB inacessivel -> passkey nao encontrada -> 400 (fail-closed).
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "Invalid passkey");
});

Deno.test("webauthn-authenticate: passkey desconhecida e recusada (400, nunca 200)", async () => {
  const res = await handler(post({
    credentialId: "cred-inexistente",
    clientDataJSON: "x",
    authenticatorData: "y",
    signature: "z",
  }));
  assert([400].includes(res.status));
});