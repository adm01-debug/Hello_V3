// Testes Deno para voip-recommendation-simulate.
// Cobertura: auth, validação, projeção positiva (alertas evitados), edge case sem dados.
import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { projectImpact, type QualityRow, type AlertRow } from '../index.ts';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL') ?? 'https://example.supabase.co';
const FN_URL = `${SUPABASE_URL}/functions/v1/voip-recommendation-simulate`;

Deno.test('rejeita requisição sem JWT', async () => {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationId: 'rec-1' }),
  });
  await res.text();
  assert([401, 404, 0].includes(res.status), `esperado 401/404 sem auth, recebido ${res.status}`);
});

Deno.test('rejeita corpo sem recommendationId', async () => {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid-token',
    },
    body: JSON.stringify({ mos: 0.5 }),
  });
  await res.text();
  assert([400, 401, 404, 0].includes(res.status), `status inesperado ${res.status}`);
});

Deno.test('projectImpact retorna baseline nulo sem dados', () => {
  const r = projectImpact([], [], { mos: 0.3 });
  assertEquals(r.avgMos, null);
  assertEquals(r.sampleSize, 0);
  assertEquals(r.totalAlerts, 0);
  assertEquals(r.projected.alertsAvoided, 0);
  assertEquals(r.projected.affectedUsersPct, 0);
});

Deno.test('projectImpact projeta melhoria de MOS positiva', () => {
  const quality: QualityRow[] = [
    { mos_avg: 3.0, jitter_avg_ms: 50, packet_loss_pct: 2, agent_name: 'a1' },
    { mos_avg: 3.2, jitter_avg_ms: 60, packet_loss_pct: 3, agent_name: 'a2' },
    { mos_avg: 4.5, jitter_avg_ms: 10, packet_loss_pct: 0.1, agent_name: 'a1' },
  ];
  const alerts: AlertRow[] = [
    { mos_at_alert: 3.0, jitter_ms: 50, alert_type: 'poor' },
    { mos_at_alert: 3.4, jitter_ms: 40, alert_type: 'poor' },
  ];
  const r = projectImpact(quality, alerts, { mos: 0.6 });
  // baseline avgMos = (3.0+3.2+4.5)/3 ≈ 3.566
  assert(r.avgMos !== null && Math.abs(r.avgMos - 3.566) < 0.01);
  // proj avgMos = baseline + 0.6 ≈ 4.166 (cap em 5)
  assert(r.projected.avgMos !== null && r.projected.avgMos > r.avgMos!);
  // ambos alertas estavam < 3.6; com +0.6 ambos passam → 2 evitados
  assertEquals(r.projected.alertsAvoided, 2);
  assertEquals(r.uniqueAgents, 2);
  // 2 amostras estavam < 3.6, 2 recuperam → 2/3 ≈ 67%
  assert(r.projected.affectedUsersPct >= 60);
});

Deno.test('projectImpact respeita limites (MOS cap em 5, jitter ≥ 0)', () => {
  const quality: QualityRow[] = [
    { mos_avg: 4.8, jitter_avg_ms: 5, packet_loss_pct: 0.5, agent_name: 'a1' },
  ];
  const r = projectImpact(quality, [], { mos: 1.0, jitter: -100, packetLoss: -10 });
  assertEquals(r.projected.avgMos, 5);
  assertEquals(r.projected.avgJitter, 0);
  assertEquals(r.projected.avgPacketLoss, 0);
});
