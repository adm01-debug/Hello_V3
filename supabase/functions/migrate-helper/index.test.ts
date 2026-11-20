import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "./index.ts";

const TEST_KEY = "test-access-key-123";
Deno.env.set("MIGRATE_HELPER_ACCESS_KEY", TEST_KEY);
Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");

Deno.test("migrate-helper: 401 sem x-access-key", async () => {
  const res = await handler(new Request("http://localhost/?action=ping"));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error, "unauthorized");
});

Deno.test("migrate-helper: 401 com chave errada", async () => {
  const res = await handler(new Request("http://localhost/?action=ping", {
    headers: { "x-access-key": "wrong" },
  }));
  assertEquals(res.status, 401);
});

Deno.test("migrate-helper: 200 em ping com chave válida", async () => {
  const res = await handler(new Request("http://localhost/?action=ping", {
    headers: { "x-access-key": TEST_KEY },
  }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(body.project_ref, "https://mock.supabase.co");
});

Deno.test("migrate-helper: action inexistente devolve 400", async () => {
  const res = await handler(new Request("http://localhost/?action=nope", {
    headers: { "x-access-key": TEST_KEY },
  }));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "unknown_action");
});

Deno.test("migrate-helper: OPTIONS devolve CORS", async () => {
  const res = await handler(new Request("http://localhost/", { method: "OPTIONS" }));
  assertEquals(res.status, 200);
  assert(res.headers.get("Access-Control-Allow-Origin"));
});
