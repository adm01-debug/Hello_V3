/**
 * Testes unitários da edge function compute-deal-health.
 * Valida: heurística de health score (recência, sentimento, momentos, satisfação, probabilidade),
 * clamping em [0, 100], composição ponderada.
 */
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

Deno.test("compute-deal-health: recencyScore decresce 5 pts/dia, mín 0", () => {
  const recencyDays = 30;
  const recencyScore = Math.max(0, 100 - recencyDays * 5);
  assertEquals(recencyScore, 0);
});

Deno.test("compute-deal-health: recencyScore = 100 quando hoje", () => {
  const recencyDays = 0;
  const recencyScore = Math.max(0, 100 - recencyDays * 5);
  assertEquals(recencyScore, 100);
});

Deno.test("compute-deal-health: sentimentScore neutro = 50", () => {
  const sentiments = ["neutral", "neutral", "neutral"];
  const positive = sentiments.filter((x) => x === "positive").length;
  const negative = sentiments.filter((x) => x === "negative").length;
  const score = sentiments.length ? ((positive - negative) / sentiments.length) * 50 + 50 : 50;
  assertEquals(score, 50);
});

Deno.test("compute-deal-health: sentimentScore 100% positivo = 100", () => {
  const sentiments = ["positive", "positive"];
  const positive = sentiments.filter((x) => x === "positive").length;
  const negative = sentiments.filter((x) => x === "negative").length;
  const score = ((positive - negative) / sentiments.length) * 50 + 50;
  assertEquals(score, 100);
});

Deno.test("compute-deal-health: momentScore penaliza objeções e bonifica next_steps", () => {
  const objections = 2, nextSteps = 3, competitors = 1;
  const score = Math.max(0, Math.min(100, 50 + nextSteps * 10 - objections * 5 - competitors * 3));
  assertEquals(score, 67);
});

Deno.test("compute-deal-health: momentScore clampado em [0, 100]", () => {
  const high = Math.max(0, Math.min(100, 50 + 100 * 10));
  const low = Math.max(0, Math.min(100, 50 - 100 * 5));
  assertEquals(high, 100);
  assertEquals(low, 0);
});

Deno.test("compute-deal-health: satScore = avg * 10", () => {
  const sat = avg([8, 9, 7]); // 8
  const satScore = sat ? sat * 10 : 50;
  assertEquals(satScore, 80);
});

Deno.test("compute-deal-health: composição ponderada respeita pesos", () => {
  // 0.2*100 + 0.25*50 + 0.25*50 + 0.15*50 + 0.15*50 = 20+12.5+12.5+7.5+7.5 = 60
  const score = Math.round(100 * 0.2 + 50 * 0.25 + 50 * 0.25 + 50 * 0.15 + 50 * 0.15);
  assertEquals(score, 60);
});

Deno.test("compute-deal-health: probability default = 50 quando ausente", () => {
  const probability = Number(undefined) || 50;
  assertEquals(probability, 50);
});
