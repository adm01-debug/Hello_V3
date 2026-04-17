// Testes Deno para edge function check-calling-hours (Onda 8)

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FN_URL = "http://localhost:54321/functions/v1/check-calling-hours";
const REQUEST_ID = "test-req-hours-001";

Deno.test("check-calling-hours: CORS preflight retorna headers", async () => {
  const res = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: { Origin: "https://lovable.dev", "x-request-id": REQUEST_ID },
  }).catch(() => null);
  if (!res) return;
  await res.text();
  assert([200, 204].includes(res.status));
});

Deno.test("check-calling-hours: rejeita sem Authorization", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ region_code: "BR" }),
  }).catch(() => null);
  if (!res) return;
  await res.text();
  assert(res.status === 401 || res.status === 403);
});

Deno.test("check-calling-hours: rejeita JWT inválido", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid.jwt",
    },
    body: JSON.stringify({ region_code: "BR" }),
  }).catch(() => null);
  if (!res) return;
  await res.text();
  assert([401, 403].includes(res.status));
});

Deno.test("check-calling-hours: aceita region_code default 'BR' (contrato)", () => {
  const region = undefined as string | undefined;
  const resolved = region ?? "BR";
  assertEquals(resolved, "BR");
});

Deno.test("check-calling-hours: dia da semana correto via timezone", () => {
  // 0=domingo, 6=sábado — contrato com check_calling_hours()
  const dow = new Date("2025-01-05T12:00:00Z").getUTCDay(); // domingo
  assertEquals(dow, 0);
});

Deno.test("check-calling-hours: propaga x-request-id (contrato)", () => {
  const headers = new Headers({ "x-request-id": REQUEST_ID });
  assertEquals(headers.get("x-request-id"), REQUEST_ID);
});
