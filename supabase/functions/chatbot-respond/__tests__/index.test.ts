import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler } from "../index.ts";

// Os testes rodam sem rede: a URL falsa evita que createClient lance por env ausente.
Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-key-de-teste");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");

const URL_FN = "http://localhost/chatbot-respond";
const CONV = "3f9d2b70-2f47-4f0a-9a5e-0f0f0f0f0f0f";

Deno.test("chatbot-respond: sem visitor_token e sem sessao devolve 401", async () => {
  const resp = await handler(
    new Request(URL_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: CONV, user_message: "qual o prazo?" }),
    }),
  );
  assertEquals(resp.status, 401);
  const body = await resp.json();
  assertEquals(body.code, "UNAUTHORIZED");
});

Deno.test("chatbot-respond: corpo sem conversation_id devolve 400", async () => {
  const resp = await handler(
    new Request(URL_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_message: "oi" }),
    }),
  );
  assertEquals(resp.status, 400);
});

Deno.test("chatbot-respond: conversation_id que nao e UUID devolve 400", async () => {
  const resp = await handler(
    new Request(URL_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: "abc", user_message: "oi" }),
    }),
  );
  assertEquals(resp.status, 400);
  const body = await resp.json();
  assertEquals(body.error, "conversation_id invalido");
});

Deno.test("chatbot-respond: preflight OPTIONS responde com CORS da origem permitida", async () => {
  const resp = await handler(
    new Request(URL_FN, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:8080", "Access-Control-Request-Method": "POST" },
    }),
  );
  assertEquals(resp.status, 200);
  assert(resp.headers.get("access-control-allow-origin"));
});
