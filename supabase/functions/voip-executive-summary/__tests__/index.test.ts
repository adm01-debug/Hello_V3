import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeHealthScore, normalizeMos, normalizeAlerts, normalizeCapacity } from "../index.ts";

Deno.test("computeHealthScore — perfeito = 100", () => {
  const score = computeHealthScore({ sla_score: 100, mos_score: 100, alerts_score: 100, capacity_score: 100 });
  assertEquals(score, 100);
});

Deno.test("computeHealthScore — fórmula ponderada correta", () => {
  // 0.4*80 + 0.3*60 + 0.2*40 + 0.1*20 = 32 + 18 + 8 + 2 = 60
  const score = computeHealthScore({ sla_score: 80, mos_score: 60, alerts_score: 40, capacity_score: 20 });
  assertEquals(score, 60);
});

Deno.test("computeHealthScore — cobre só as dimensões medidas", () => {
  // só SLA e MOS medidos (cobertura 2): (0.4*100 + 0.3*80) / 0.7 = 64/0.7 ≈ 91
  const score = computeHealthScore({ sla_score: 100, mos_score: 80, alerts_score: null, capacity_score: null });
  assertEquals(score, 91);
});

Deno.test("computeHealthScore — cobertura < 2 devolve null", () => {
  const score = computeHealthScore({ sla_score: 100, mos_score: null, alerts_score: null, capacity_score: null });
  assertEquals(score, null);
});

Deno.test("normalizeMos — null retorna null (sem medição)", () => {
  assertEquals(normalizeMos(null), null);
});

Deno.test("normalizeMos — MOS 4.0 ≈ 75", () => {
  const v = normalizeMos(4.0);
  assert(v !== null && v >= 70 && v <= 80, `esperado ~75, recebido ${v}`);
});

Deno.test("normalizeAlerts — sem chamadas retorna null (sem medição)", () => {
  assertEquals(normalizeAlerts(0, 0), null);
});

Deno.test("normalizeAlerts — 10% unack zera o score", () => {
  const v = normalizeAlerts(10, 100);
  assertEquals(v, 0);
});

Deno.test("normalizeCapacity — sem sessões retorna null", () => {
  assertEquals(normalizeCapacity(0, false), null);
});

Deno.test("normalizeCapacity — pico baixo retorna 100", () => {
  assertEquals(normalizeCapacity(1, true), 100);
});

Deno.test("normalizeCapacity — atingir cap penaliza forte", () => {
  const v = normalizeCapacity(3, true);
  assert(v !== null && v <= 30, `esperado ≤30, recebido ${v}`);
});
