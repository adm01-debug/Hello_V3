import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { AnalyzeCallSchema } from "../schema.ts";
import { validateBody } from "../../_shared/validator.ts";

Deno.test("AnalyzeCallSchema - valid data", async () => {
  const payload = {
    transcript: "Agent: Hello. Customer: Hi, I need help.",
    callInfo: {
      contactName: "John Doe",
      phone: "+123456789",
      duration: "02:30",
      type: "support"
    }
  };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, AnalyzeCallSchema);
  assertEquals(errorResponse, undefined);
  assertEquals(data?.transcript, payload.transcript);
});

Deno.test("AnalyzeCallSchema - missing transcript", async () => {
  const payload = {
    callInfo: { contactName: "John Doe" }
  };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, AnalyzeCallSchema);
  assertEquals(data, undefined);
  assertEquals(errorResponse?.status, 422);
  const errorBody = await errorResponse?.json();
  assertEquals(errorBody.fields[0].field, "transcript");
});

Deno.test("AnalyzeCallSchema - transcript too short", async () => {
  const payload = { transcript: "" };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, AnalyzeCallSchema);
  assertEquals(errorResponse?.status, 422);
});

Deno.test("AnalyzeCallSchema - transcript too long", async () => {
  const payload = { transcript: "a".repeat(10001) };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, AnalyzeCallSchema);
  assertEquals(errorResponse?.status, 422);
  const errorBody = await errorResponse?.json();
  assertEquals(errorBody.fields[0].field, "transcript");
});

Deno.test("AnalyzeCallSchema - optional callInfo", async () => {
  const payload = { transcript: "Just some transcript" };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, AnalyzeCallSchema);
  assertEquals(errorResponse, undefined);
  assertEquals(data?.transcript, payload.transcript);
});

Deno.test("AnalyzeCallSchema - invalid callInfo fields", async () => {
  const payload = { 
    transcript: "Valid transcript",
    callInfo: {
      contactName: 123 // Should be string
    }
  };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, AnalyzeCallSchema);
  assertEquals(errorResponse?.status, 422);
  const errorBody = await errorResponse?.json();
  assertEquals(errorBody.fields[0].field, "callInfo.contactName");
});
