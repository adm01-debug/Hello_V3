import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { planRemediation, idempotencyKey } from '../index.ts';

Deno.test('planRemediation — mos:outage retorna ação crítica de codec', () => {
  const p = planRemediation('mos', 'outage');
  assertEquals(p.action_type, 'force_codec_opus_low');
  assertEquals(p.category, 'codec');
  assertEquals(p.severity, 'critical');
  assertEquals(p.destructive, false);
});

Deno.test('planRemediation — jitter:outage pausa campanhas', () => {
  const p = planRemediation('jitter', 'outage');
  assertEquals(p.action_type, 'pause_outbound_campaigns');
  assertEquals(p.category, 'campaign');
  assert(!p.destructive);
});

Deno.test('planRemediation — combinação desconhecida vira noop', () => {
  // @ts-expect-error força combinação inválida
  const p = planRemediation('latency', 'spike');
  assertEquals(p.action_type, 'noop');
});

Deno.test('idempotencyKey — chave estável e derivada do id', () => {
  const k = idempotencyKey('abc-123');
  assertEquals(k, 'anomaly:abc-123');
});
