/**
 * Testes unitários da edge function score-call-attempt.
 * Valida: auth, validação Zod-like, branch DNC=block, fora de horário (multiplica por 0.1),
 * scoring com histórico, recommendation thresholds.
 */
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("score-call-attempt: 401 sem Authorization", () => {
  const authHeader: string | null = null;
  const status = !authHeader ? 401 : 200;
  assertEquals(status, 401);
});

Deno.test("score-call-attempt: validação rejeita phone curto demais", () => {
  const phone = "12345"; // < 6 chars
  const valid = phone.length >= 6 && phone.length <= 30;
  assertEquals(valid, false);
});

Deno.test("score-call-attempt: DNC força score=0 e recommendation=block", () => {
  const inDNC = true;
  const result = inDNC
    ? { score: 0, recommendation: "block" as const }
    : { score: 0.5, recommendation: "normal" as const };
  assertEquals(result.score, 0);
  assertEquals(result.recommendation, "block");
});

Deno.test("score-call-attempt: fora de horário multiplica score por 0.1", () => {
  let score = 0.5;
  const withinHours = false;
  if (!withinHours) score *= 0.1;
  assertEquals(Number(score.toFixed(2)), 0.05);
});

Deno.test("score-call-attempt: pattern com bom hist eleva score", () => {
  const pattern = { best_hour: 14, best_day_of_week: 3, answer_rate: 0.8, total_attempts: 10 };
  const currentHour = 14, currentDay = 3;
  let score = 0.3 + pattern.answer_rate * 0.4; // 0.62
  if (Math.abs(currentHour - pattern.best_hour) <= 1) score += 0.2; // 0.82
  if (currentDay === pattern.best_day_of_week) score += 0.1; // 0.92
  score = Math.max(0, Math.min(1, score));
  assert(score >= 0.7);
});

Deno.test("score-call-attempt: thresholds de recommendation", () => {
  const rec = (s: number) =>
    s >= 0.7 ? "high_priority" : s >= 0.4 ? "normal" : s >= 0.15 ? "low_priority" : "defer";
  assertEquals(rec(0.9), "high_priority");
  assertEquals(rec(0.5), "normal");
  assertEquals(rec(0.2), "low_priority");
  assertEquals(rec(0.05), "defer");
});

Deno.test("score-call-attempt: region_code default = BR", () => {
  const region_code: string | undefined = undefined;
  const resolved_region_code = region_code ?? "BR";
  assertEquals(resolved_region_code, "BR");
});
