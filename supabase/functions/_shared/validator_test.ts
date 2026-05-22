import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { validateBody, createErrorResponse } from "./validator.ts";

const TestSchema = z.object({
  name: z.string().min(3),
  age: z.number().int().positive(),
  email: z.string().email().optional(),
});

Deno.test("validateBody - valid data", async () => {
  const payload = { name: "John Doe", age: 30 };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, TestSchema);
  assertEquals(errorResponse, undefined);
  assertEquals(data, payload);
});

Deno.test("validateBody - invalid field types", async () => {
  const payload = { name: "Jo", age: -1 }; // Too short and negative
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, TestSchema);
  assertEquals(data, undefined);
  assertEquals(errorResponse?.status, 422);

  const errorBody = await errorResponse?.json();
  assertEquals(errorBody.code, "VALIDATION_ERROR");
  assertEquals(errorBody.fields.length, 2);
  assertEquals(errorBody.fields[0].field, "name");
  assertEquals(errorBody.fields[1].field, "age");
});

Deno.test("validateBody - missing required fields", async () => {
  const payload = { age: 30 };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const { data, errorResponse } = await validateBody(req, TestSchema);
  assertEquals(errorResponse?.status, 422);
  const errorBody = await errorResponse?.json();
  assertEquals(errorBody.fields[0].field, "name");
});

Deno.test("validateBody - invalid JSON", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: "invalid-json",
  });

  const { data, errorResponse } = await validateBody(req, TestSchema);
  assertEquals(errorResponse?.status, 400);
  const errorBody = await errorResponse?.json();
  assertEquals(errorBody.code, "INVALID_JSON");
});

Deno.test("createErrorResponse - custom status and code", () => {
  const response = createErrorResponse("Not Found", "NOT_FOUND", undefined, 404);
  assertEquals(response.status, 404);
});
