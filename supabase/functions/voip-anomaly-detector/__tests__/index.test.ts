import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { detectAnomalies } from "../index.ts";

Deno.test("detectAnomalies — sem anomalias quando obs próximo da média", () => {
  const out = detectAnomalies(
    { mos: [4.2, 4.3], jitter: [10, 12], volume: 5 },
    { mos: [4.1, 4.2, 4.3, 4.2, 4.1], jitter: [10, 11, 12, 10, 11], volumes: [5, 6, 4, 5, 6] },
    { hour: 10, dow: 1, started_at: '2025-01-01T00:00:00Z' }
  );
  assertEquals(out.length, 0);
});

Deno.test("detectAnomalies — MOS muito baixo gera anomaly critical", () => {
  const out = detectAnomalies(
    { mos: [2.0, 2.1], jitter: [], volume: 0 },
    { mos: [4.2, 4.3, 4.1, 4.2, 4.3, 4.2, 4.1], jitter: [], volumes: [] },
    { hour: 10, dow: 1, started_at: '2025-01-01T00:00:00Z' }
  );
  const mosAnomaly = out.find(a => a.metric === 'mos');
  assert(mosAnomaly);
  assertEquals(mosAnomaly!.severity, 'critical');
  assert(mosAnomaly!.z_score < -3.5);
});

Deno.test("detectAnomalies — jitter elevado gera warning", () => {
  const out = detectAnomalies(
    { mos: [], jitter: [50, 55], volume: 0 },
    { mos: [], jitter: [10, 12, 11, 13, 10, 11, 12], volumes: [] },
    { hour: 10, dow: 1, started_at: '2025-01-01T00:00:00Z' }
  );
  const jit = out.find(a => a.metric === 'jitter');
  assert(jit);
  assert(jit!.z_score >= 2.5);
});

Deno.test("detectAnomalies — baseline insuficiente não gera anomaly", () => {
  const out = detectAnomalies(
    { mos: [2.0], jitter: [], volume: 0 },
    { mos: [4.2, 4.3], jitter: [], volumes: [] },
    { hour: 10, dow: 1, started_at: '2025-01-01T00:00:00Z' }
  );
  assertEquals(out.length, 0);
});
