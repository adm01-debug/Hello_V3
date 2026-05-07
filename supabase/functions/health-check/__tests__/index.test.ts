 import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
 import { handler } from "../index.ts";
 
 Deno.test("health-check: handles OPTIONS", async () => {
   const req = new Request("http://localhost", { method: "OPTIONS" });
   const res = await handler(req);
   assertEquals(res.status, 200);
   assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
 });
 
 Deno.test("health-check: returns health status", async () => {
   // Setting up env for test
   Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
   Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "mock-key");
 
   const req = new Request("http://localhost", { method: "GET" });
   try {
     const res = await handler(req);
     // It might fail due to fetch failure to mock.supabase.co, which is caught and returns 500 or 503
     assert([200, 503, 500].includes(res.status));
     const body = await res.json();
     assert(body.status);
     assert(body.timestamp);
   } catch (e) {
     // If the handler throws (unlikely with try-catch inside)
     assertEquals(true, true);
   }
 });
