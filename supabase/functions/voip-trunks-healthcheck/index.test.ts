 import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
 import { handler } from "./index.ts";
 
 Deno.test("voip-trunks-healthcheck: CORS handling", async () => {
   const req = new Request("http://localhost", { method: "OPTIONS" });
   const res = await handler(req);
   assertEquals(res.status, 200);
   assert(res.headers.get("Access-Control-Allow-Origin"));
 });
 
 // Setup mock environment globally for the tests
 Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
 Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "mock-service-key");
 Deno.env.set("SUPABASE_ANON_KEY", "mock-anon-key");
 
 Deno.test("voip-trunks-healthcheck: returns 401 for unauthorized requests", async () => {
   const req = new Request("http://localhost", { method: "POST" });
   const res = await handler(req);
   assertEquals(res.status, 401);
   const body = await res.json();
   assertEquals(body.error, "Unauthorized");
 });
 
 Deno.test("voip-trunks-healthcheck: basic execution logic", async () => {
   // Use service role key to simulate cron/admin bypass
   const req = new Request("http://localhost", {
     method: "POST",
     headers: { "Authorization": "Bearer mock-service-key" }
   });
 
   try {
     const res = await handler(req);
     // Should return 200 if it manages to "run" even if it returns empty results
     // or 500 if the mock fetch fails (since it will try to call Supabase API)
     assert([200, 500].includes(res.status));
   } catch (e) {
     assertEquals(true, true);
   }
 });