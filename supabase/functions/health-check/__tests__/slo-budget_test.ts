import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { budget } from "../slo-budget.ts";

Deno.test("budget - sem falhas mantem o budget intacto", () => {
  const r = budget({ total: 100, bad: 0, targetPct: 99.9 });
  assertEquals(r.status, "healthy");
  assertEquals(r.burn_rate, 0);
  assertEquals(r.remaining_pct, 100);
  assertEquals(r.tolerance_pct, 0.1);
});

Deno.test("budget - falha igual a tolerancia zera o budget", () => {
  const r = budget({ total: 1000, bad: 10, targetPct: 99 });
  assertEquals(r.status, "exhausted");
  assertEquals(r.remaining_pct, 0);
  assertEquals(r.burn_rate, 1);
});

Deno.test("budget - falha acima da tolerancia escala o burn rate", () => {
  const r = budget({ total: 100, bad: 5, targetPct: 99 });
  assertEquals(r.status, "exhausted");
  assertEquals(r.burn_rate, 5);
});

Deno.test("budget - metade da tolerancia entra em warning", () => {
  const r = budget({ total: 100, bad: 2, targetPct: 96 });
  assertEquals(r.status, "warning");
  assertEquals(r.burn_rate, 0.5);
  assertEquals(r.remaining_pct, 50);
});

Deno.test("budget - consumo baixo permanece healthy", () => {
  const r = budget({ total: 100, bad: 1, targetPct: 97 });
  assertEquals(r.status, "healthy");
  assertEquals(r.burn_rate, 0.3333);
});

Deno.test("budget - sem amostras nao divide por zero", () => {
  const r = budget({ total: 0, bad: 0, targetPct: 99 });
  assertEquals(r.status, "unknown");
  assertEquals(r.burn_rate, 0);
  assertEquals(r.remaining_pct, 100);
});

Deno.test("budget - respeita a janela minima de amostras", () => {
  assertEquals(budget({ total: 3, bad: 1, targetPct: 99 }).status, "unknown");
  assertEquals(budget({ total: 3, bad: 1, targetPct: 99, minSamples: 3 }).status, "exhausted");
});

Deno.test("budget - bad acima de total e truncado", () => {
  assertEquals(budget({ total: 20, bad: 50, targetPct: 99 }).burn_rate, 100);
});

Deno.test("budget - bad negativo vira zero", () => {
  assertEquals(budget({ total: 100, bad: -5, targetPct: 99 }).status, "healthy");
});

Deno.test("budget - alvo de 100% esgota com qualquer falha", () => {
  assertEquals(budget({ total: 100, bad: 0, targetPct: 100 }).status, "healthy");
  assertEquals(budget({ total: 100, bad: 1, targetPct: 100 }).status, "exhausted");
});

Deno.test("budget - total nao finito vira unknown", () => {
  assertEquals(budget({ total: Number.NaN, bad: 0, targetPct: 99 }).status, "unknown");
  assertEquals(budget({ total: Number.POSITIVE_INFINITY, bad: 0, targetPct: 99 }).status, "unknown");
});