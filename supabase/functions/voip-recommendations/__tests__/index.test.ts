import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildRecommendations, type SignalContext } from '../index.ts';

function ctx(overrides: Partial<SignalContext> = {}): SignalContext {
  return {
    slaPct: 95,
    avgMos: 4.2,
    avgJitter: 15,
    unackAlerts: 0,
    totalAlerts: 0,
    peakConcurrent: 1,
    worstAgent: null,
    totalCalls: 100,
    ...overrides,
  };
}

Deno.test('buildRecommendations - sistema saudável retorna lista vazia', () => {
  const recs = buildRecommendations(ctx());
  assertEquals(recs.length, 0);
});

Deno.test('buildRecommendations - capacidade saturada gera crítico de prioridade máxima', () => {
  const recs = buildRecommendations(ctx({ peakConcurrent: 3 }));
  assertEquals(recs.length, 1);
  assertEquals(recs[0].id, 'cap-saturated');
  assertEquals(recs[0].severity, 'critical');
  assertEquals(recs[0].category, 'capacity');
  assert(recs[0].priority_score >= 90);
});

Deno.test('buildRecommendations - múltiplos sinais ordenados por prioridade descendente', () => {
  const recs = buildRecommendations(ctx({
    peakConcurrent: 3,                                    // 95
    worstAgent: { name: 'Ana', mos: 2.8, calls: 5 },      // 90
    avgJitter: 60,                                        // 85
    unackAlerts: 12,                                      // 80
    slaPct: 70,                                           // 88
  }));
  assert(recs.length <= 5);
  for (let i = 1; i < recs.length; i++) {
    assert(recs[i - 1].priority_score >= recs[i].priority_score);
  }
  assertEquals(recs[0].id, 'cap-saturated');
});

Deno.test('buildRecommendations - jitter alto gera ação de função (testar conexão)', () => {
  const recs = buildRecommendations(ctx({ avgJitter: 55 }));
  const rec = recs.find(r => r.category === 'infra');
  assert(rec);
  assertEquals(rec!.action_type, 'function');
  assertEquals(rec!.action_payload.action, 'run_connectivity_test');
  assertEquals(rec!.severity, 'critical');
});
