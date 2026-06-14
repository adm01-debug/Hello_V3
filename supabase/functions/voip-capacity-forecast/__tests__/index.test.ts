import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildHistory, forecastNextDays, type HistoryDay } from "../index.ts";

Deno.test("buildHistory — agrupa sessões por dia e identifica pico", () => {
  const sessions = [
    { started_at: '2025-01-01T10:00:00Z', duration_seconds: 60 },
    { started_at: '2025-01-01T10:30:00Z', duration_seconds: 120 },
    { started_at: '2025-01-01T15:00:00Z', duration_seconds: 90 },
    { started_at: '2025-01-02T09:00:00Z', duration_seconds: 60 },
  ];
  const h = buildHistory(sessions);
  assertEquals(h.length, 2);
  assertEquals(h[0].total_calls, 3);
  assertEquals(h[0].peak_concurrent, 2);
});

Deno.test("forecastNextDays — vazio quando histórico < 7 dias", () => {
  const h = [{ date: '2025-01-01', total_calls: 5, peak_hour: 10, peak_concurrent: 2 }];
  assertEquals(forecastNextDays(h, 7).length, 0);
});

Deno.test("forecastNextDays — gera 7 dias com confiança quando há histórico", () => {
  const h: HistoryDay[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date('2025-01-01T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    h.push({ date: d.toISOString().slice(0, 10), total_calls: 10 + (i % 7), peak_hour: 14, peak_concurrent: 2 });
  }
  const fc = forecastNextDays(h, 7);
  assertEquals(fc.length, 7);
  assert(fc[0].confidence_pct > 0);
  assert(fc[0].predicted_calls >= 10);
});

Deno.test("forecastNextDays — sinaliza exceeds_capacity quando peak > cap", () => {
  const h: HistoryDay[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date('2025-01-01T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    h.push({ date: d.toISOString().slice(0, 10), total_calls: 50, peak_hour: 14, peak_concurrent: 5 });
  }
  const fc = forecastNextDays(h, 7);
  assert(fc.some(f => f.exceeds_capacity));
});
