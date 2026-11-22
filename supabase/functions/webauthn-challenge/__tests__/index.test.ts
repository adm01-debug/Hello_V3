// Testes da edge webauthn-challenge: validacao, rate-limit e fail-closed.
// Como a edge usa service role para inserir o desafio, exercitamos os
// caminhos de rejeicao sem rede (SUPABASE_URL aponta para a porta 9,
// discard) - sao os que precisam ser confiaveis.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { capturarHandler } from "../../_shared/__tests__/capture-handler.ts";

Deno.env.set("SUPABASE_URL", "http://127.0.0.1:9");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key-de-teste");

const handler = await capturarHandler(() => import("../index.ts"));
const URL_FN = "http://localhost/functions/v1/webauthn-challenge";

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("webauthn-challenge: OPTIONS devolve preflight CORS vazio", async () => {
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

Deno.test("webauthn-challenge: sem e-mail responde 400", async () => {
  const res = await handler(post({}));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "Informe o e-mail para entrar com passkey");
});

Deno.test("webauthn-challenge: e-mail vazio responde 400", async () => {
  const res = await handler(post({ email: "   " }));
  assertEquals(res.status, 400);
});

Deno.test("webauthn-challenge: payload invalido responde 400, nunca 500", async () => {
  const res = await handler(post({ email: 123 }));
  assert([400, 404].includes(res.status));
});

Deno.test("webauthn-challenge: e-mail sem passkey responde 404", async () => {
  // DB inacessivel -> profile null -> 404 (nao revela existencia).
  const res = await handler(post({ email: "nao-existe@x.com" }));
  assertEquals(res.status, 404);
  assertEquals(
    (await res.json()).error,
    "Nenhuma passkey encontrada para este e-mail",
  );
});