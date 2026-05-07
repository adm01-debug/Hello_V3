 import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
 import { handler } from "./index.ts";
 
 Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
 Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "mock-service-key");
 Deno.env.set("SUPABASE_ANON_KEY", "mock-anon-key");
 
 Deno.test("database-cleanup: CORS handling", async () => {
   const req = new Request("http://localhost", { method: "OPTIONS" });
   const res = await handler(req);
   assertEquals(res.status, 200);
   assert(res.headers.get("Access-Control-Allow-Origin"));
 });
 
 Deno.test("database-cleanup: returns 401 for unauthorized requests", async () => {
   const req = new Request("http://localhost", { method: "POST" });
   const res = await handler(req);
   assertEquals(res.status, 401);
   const body = await res.json();
   assertEquals(body.error, "Missing authorization header");
 });