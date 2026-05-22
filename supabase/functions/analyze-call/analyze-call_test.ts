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
  if (!result.success) {
    assertEquals(result.error.errors[0].path[0], "transcript");
  }
});

Deno.test("AnalyzeCallSchema fails on empty transcript", () => {
  const invalidData = {
    transcript: ""
  };
  const result = AnalyzeCallSchema.safeParse(invalidData);
  assertEquals(result.success, false);
});

Deno.test("AnalyzeCallSchema validates with minimal input", () => {
  const minimalData = {
    transcript: "Short call."
  };
  const result = AnalyzeCallSchema.safeParse(minimalData);
  assertEquals(result.success, true);
});

Deno.test("AnalyzeCallSchema handles edge cases in callInfo", () => {
  const data = {
    transcript: "Testing edge cases.",
    callInfo: {
      contactName: "", // empty name allowed
      phone: "invalid-phone", // string allowed
      duration: "long", // string allowed
      type: "unknown" // string allowed
    }
  };
  const result = AnalyzeCallSchema.safeParse(data);
  assertEquals(result.success, true);
});
