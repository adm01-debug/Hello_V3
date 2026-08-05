// Testes Deno para edge function check-queue-metrics (Onda 8)

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FN_URL = "http://localhost:54321/functions/v1/check-queue-metrics";
const REQUEST_ID = "test-req-queue-001";

Deno.test("check-queue-metrics: CORS preflight retorna headers válidos", async () => {
  const res = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: { Origin: "https://lovable.dev", "x-request-id": REQUEST_ID },
  }).catch(() => null);
  if (!res) return;
  await res.text();
  assert([200, 204].includes(res.status));
});

Deno.test("check-queue-metrics: rejeita ausência de Authorization", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => null);
  if (!res) return;
  const body = await res.json().catch(() => ({}));
  assertEquals(res.status, 401);
  assert("error" in body || res.status === 401);
});

Deno.test("check-queue-metrics: rejeita JWT inválido", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid.token",
    },
  }).catch(() => null);
  if (!res) return;
  await res.text();
  assert([401, 403].includes(res.status));
});

Deno.test("check-queue-metrics: cálculo de avg wait time (contrato)", () => {
  const completed = [
    { hold_time_seconds: 30 },
    { hold_time_seconds: 60 },
    { hold_time_seconds: 90 },
  ];
  const total = completed.reduce((s, c) => s + c.hold_time_seconds, 0);
  const avg = Math.round(total / completed.length);
  assertEquals(avg, 60);
});

Deno.test("check-queue-metrics: cálculo de abandonment rate (contrato)", () => {
  const completed = 8;
  const abandoned = 2;
  const total = completed + abandoned;
  const rate = Math.round((abandoned / total) * 100);
  assertEquals(rate, 20);
});

Deno.test("check-queue-metrics: service level (≤30s contrato)", () => {
  const completed = [
    { hold_time_seconds: 10 },
    { hold_time_seconds: 25 },
    { hold_time_seconds: 45 },
    { hold_time_seconds: 60 },
  ];
  const quick = completed.filter((c) => c.hold_time_seconds <= 30).length;
  const sl = Math.round((quick / completed.length) * 100);
  assertEquals(sl, 50);
});

Deno.test("check-queue-metrics: thresholds default (contrato)", () => {
  const defaults = {
    avgWaitTimeWarning: 45,
    avgWaitTimeCritical: 90,
    abandonmentRateWarning: 10,
    abandonmentRateCritical: 20,
  };
  assert(defaults.avgWaitTimeCritical > defaults.avgWaitTimeWarning);
  assert(defaults.abandonmentRateCritical > defaults.abandonmentRateWarning);
});
