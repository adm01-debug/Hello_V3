import { AnalyzeCallSchema } from "./schema.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("AnalyzeCallSchema validates correct input", () => {
  const validData = {
    transcript: "Hello, I need help with my account.",
    callInfo: {
      contactName: "John Doe",
      phone: "+123456789",
      duration: "05:30",
      type: "outbound"
    }
  };
  const result = AnalyzeCallSchema.safeParse(validData);
  assertEquals(result.success, true);
});

Deno.test("AnalyzeCallSchema fails on missing transcript", () => {
  const invalidData = {
    callInfo: {
      contactName: "John Doe"
    }
  };
  const result = AnalyzeCallSchema.safeParse(invalidData);
  assertEquals(result.success, false);
});

Deno.test("AnalyzeCallSchema fails on very long transcript exceeding limit", () => {
  const longTranscript = "a".repeat(50001); // Limit is 50000
  const result = AnalyzeCallSchema.safeParse({ transcript: longTranscript });
  assertEquals(result.success, false);
});


Deno.test("Integration: analyze-call v1 structure", async () => {
  // Simulated request for integration check
  const req = new Request("http://localhost/analyze-call/v1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: "Integration test call." })
  });
  
  // This just tests the schema logic which is what drives the function
  const body = await req.json();
  const result = AnalyzeCallSchema.safeParse(body);
  assertEquals(result.success, true);
});

Deno.test("Integration: analyze-call v2 structure with extended info", async () => {
  const req = new Request("http://localhost/analyze-call/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      transcript: "High value customer call.",
      callInfo: { type: "inbound", duration: "10:00" }
    })
  });
  
  const body = await req.json();
  const result = AnalyzeCallSchema.safeParse(body);
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.data.callInfo?.type, "inbound");
  }
});


