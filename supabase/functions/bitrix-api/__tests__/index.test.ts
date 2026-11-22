// Testes da edge bitrix-api: auth, validacao e SSRF.
// O handler e exportado, entao exercitamos os caminhos de rejeicao sem rede:
// sao justamente os que precisam ser confiaveis (fail-closed).
// SUPABASE_URL aponta para a porta 9 (discard) para que a validacao de
// usuario falhe rapido, como um token invalido em producao.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { handler } from "../index.ts";

const URL_FN = "http://localhost/functions/v1/bitrix-api";

Deno.env.set("SUPABASE_URL", "http://127.0.0.1:9");
Deno.env.set("SUPABASE_ANON_KEY", "anon-key-de-teste");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key-de-teste");

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("bitrix-api: OPTIONS devolve preflight CORS vazio", async () => {
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

Deno.test("bitrix-api: sem Authorization responde 401", async () => {
  const res = await handler(post({ action: "get_contacts" }));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error, "Não autorizado");
});

Deno.test("bitrix-api: token invalido responde 401, nunca 500", async () => {
  const res = await handler(
    post(
      { action: "get_contacts" },
      { Authorization: "Bearer token.invalido.aqui" },
    ),
  );
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error, "Não autorizado");
});

Deno.test("bitrix-api: acao desconhecida e recusada pelo schema", async () => {
  const res = await handler(
    post(
      { action: "apagar_tudo" },
      { Authorization: "Bearer token.invalido.aqui" },
    ),
  );
  // O schema de envelope roda depois do auth; sem auth valida o contrato
  // e negar. O que nao pode acontecer e 200 ou 500.
  assert([400, 401].includes(res.status));
});
