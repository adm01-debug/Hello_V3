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
  const data = { transcript: "Integration test call." };
  const result = AnalyzeCallSchema.safeParse(data);
  assertEquals(result.success, true);
});

Deno.test("Integration: analyze-call v2 structure with extended info", async () => {
  const data = { 
    transcript: "High value customer call.",
    callInfo: { type: "inbound", duration: "10:00" }
  };
  
  const result = AnalyzeCallSchema.safeParse(data);
  assertEquals(result.success, true);
  if (result.success === true) {
    assertEquals(result.data.callInfo?.type, "inbound");
  }
});
