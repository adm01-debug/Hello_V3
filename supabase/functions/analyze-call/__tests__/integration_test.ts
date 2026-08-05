import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { AnalyzeCallSchema } from "../schema.ts";

Deno.test("analyze-call integration: validate v1 flow", async () => {
  const payload = {
    transcript: "Olá, gostaria de cancelar meu serviço.",
    callInfo: {
      contactName: "João Silva",
      duration: "05:30"
    }
  };

  const result = AnalyzeCallSchema.safeParse(payload);
  assertEquals(result.success, true);
});

Deno.test("analyze-call integration: reject invalid v2 flow (missing transcript)", async () => {
  const payload = {
    callInfo: {
      contactName: "Invalido"
    }
  };

  const result = AnalyzeCallSchema.safeParse(payload);
  assertEquals(result.success, false);
});

Deno.test("analyze-call integration: validate character limits", async () => {
  const longTranscript = "a".repeat(10001);
  const payload = {
    transcript: longTranscript,
    callInfo: { contactName: "Teste" }
  };

  const result = AnalyzeCallSchema.safeParse(payload);
  assertEquals(result.success, false);
});

