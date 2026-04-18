import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { forecast, linearSlope, buildBuckets, type QualitySample } from "../index.ts";

function genSamples(days: number, mosFn: (i: number) => number): QualitySample[] {
  const out: QualitySample[] = [];
  const base = new Date('2025-01-01T00:00:00Z').getTime();
  for (let i = 0; i < days * 24; i++) {
    out.push({
      created_at: new Date(base + i * 3600_000).toISOString(),
      mos_avg: mosFn(i),
      jitter_avg_ms: 20,
    });
  }
  return out;
}

Deno.test("linearSlope — detecta tendência decrescente", () => {
  const slope = linearSlope([5, 4.5, 4, 3.5, 3]);
  assert(slope < 0);
});

Deno.test("forecast — gera horizonte solicitado com MOS válido", () => {
  const samples = genSamples(30, () => 4.2);
  const r = forecast(samples, 24);
  assertEquals(r.forecast.length, 24);
  assert(r.summary.avg_mos_predicted > 3.5);
});

Deno.test("forecast — sinaliza risco quando MOS previsto < 3.5", () => {
  const samples = genSamples(30, () => 3.0);
  const r = forecast(samples, 24);
  assert(r.summary.risk_windows > 0);
  assert(r.forecast.some(f => f.is_risk && f.risk_reason?.includes('MOS')));
});

Deno.test("forecast — buckets agrupam corretamente por (dow, hour)", () => {
  const samples = genSamples(7, (i) => 4 + (i % 5) * 0.1);
  const buckets = buildBuckets(samples);
  // 7 dias × 24h = 168 buckets distintos no máximo
  assert(buckets.size > 0 && buckets.size <= 168);
});
