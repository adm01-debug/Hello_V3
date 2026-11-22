// record-consent grava consentimento TCPA/LGPD: a prova legal de que o
// titular autorizou contato. Um bug aqui nao quebra a tela, gera multa.
// Testamos os caminhos fail-closed sem tocar Supabase.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { capturarHandler } from "../../_shared/__tests__/capture-handler.ts";

// Isola o ambiente: outros arquivos de teste no mesmo processo checam
// SUPABASE_URL para decidir se rodam. Se deixarmos um valor nosso aqui,
// contaminamos a suite inteira.
function semear(nome: string, valor: string) {
  const anterior = Deno.env.get(nome);
  Deno.env.set(nome, valor);
  addEventListener("unload", () => {
    if (anterior === undefined) Deno.env.delete(nome);
    else Deno.env.set(nome, anterior);
  });
}

semear("SUPABASE_URL", "http://127.0.0.1:9");
semear("SUPABASE_ANON_KEY", "anon-key-de-teste");

const URL_FN = "http://localhost/functions/v1/record-consent";
const handler = await capturarHandler(() => import("../index.ts"));

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(URL_FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("record-consent: OPTIONS devolve preflight", async () => {
  const res = await handler(
    new Request(URL_FN, {
      method: "OPTIONS",
      headers: { Origin: "https://hello-v3.vercel.app" },
    }),
  );
  assertEquals(res.status, 200);
});

Deno.test("record-consent: sem Authorization responde 401", async () => {
  const res = await handler(post({ channel: "voice", consent_type: "recording" }));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error, "Missing auth");
});

Deno.test("record-consent: token invalido nao grava consentimento", async () => {
  // Com Authorization presente mas sem usuario valido, a edge precisa
  // parar no auth. Nunca 200, porque isso significaria consentimento
  // gravado sem identidade verificada.
  const res = await handler(
    post(
      { channel: "voice", consent_type: "recording" },
      { Authorization: "Bearer token.invalido" },
    ),
  );
  assert(res.status !== 200, `consentimento gravado sem auth valida: ${res.status}`);
});

Deno.test("record-consent: canal fora do enum nao e aceito", async () => {
  const res = await handler(
    post(
      { channel: "telegram", consent_type: "recording" },
      { Authorization: "Bearer token.invalido" },
    ),
  );
  assert(res.status !== 200, `canal invalido aceito: ${res.status}`);
});

Deno.test("record-consent: consent_type fora do enum nao e aceito", async () => {
  const res = await handler(
    post(
      { channel: "voice", consent_type: "qualquer_coisa" },
      { Authorization: "Bearer token.invalido" },
    ),
  );
  assert(res.status !== 200, `consent_type invalido aceito: ${res.status}`);
});

Deno.test("record-consent: JSON quebrado nao vira 200", async () => {
  const res = await handler(
    post("{quebrado", { Authorization: "Bearer token.invalido" }),
  );
  assert(res.status >= 400, `status inesperado: ${res.status}`);
});
