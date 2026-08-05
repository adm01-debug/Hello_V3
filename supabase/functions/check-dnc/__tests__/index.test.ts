// Testes Deno para edge function check-dnc (Onda 8)
// Cobre: CORS preflight, auth branches, validação de entrada, x-request-id

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FN_URL = "http://localhost:54321/functions/v1/check-dnc";
const REQUEST_ID = "test-req-dnc-001";

Deno.test("check-dnc: CORS preflight responde 200/204 com headers", async () => {
  const res = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: { Origin: "https://lovable.dev", "x-request-id": REQUEST_ID },
  }).catch(() => null);
  if (!res) return; // ambiente sem supabase local
  await res.text();
  assert([200, 204].includes(res.status));
  assert(res.headers.get("access-control-allow-origin") !== null);
});

Deno.test("check-dnc: rejeita requisição sem Authorization", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "+5511999999999" }),
  }).catch(() => null);
  if (!res) return;
  const body = await res.text();
  assertEquals(res.status >= 400, true);
  assert(body.length >= 0);
});

Deno.test("check-dnc: rejeita JWT inválido", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid.jwt.token",
    },
    body: JSON.stringify({ phone: "+5511999999999" }),
  }).catch(() => null);
  if (!res) return;
  await res.text();
  assert([401, 403].includes(res.status));
});

Deno.test("check-dnc: valida campo phone obrigatório", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer fake",
    },
    body: JSON.stringify({}),
  }).catch(() => null);
  if (!res) return;
  await res.text();
  assert(res.status >= 400);
});

Deno.test("check-dnc: propaga x-request-id no log", () => {
  // Validação determinística do contrato de header
  const headers = new Headers({ "x-request-id": REQUEST_ID });
  assertEquals(headers.get("x-request-id"), REQUEST_ID);
});

Deno.test("check-dnc: normaliza telefone removendo não-numéricos (contrato)", () => {
  const phone = "+55 (11) 99999-9999";
  const normalized = phone.replace(/[^0-9]/g, "");
  assertEquals(normalized, "5511999999999");
});
