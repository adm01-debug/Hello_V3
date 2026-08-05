import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { aggregate, type ActionRow } from '../index.ts';

function row(overrides: Partial<ActionRow> = {}): ActionRow {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    recommendation_id: 'rec-x',
    category: 'infra',
    severity: 'critical',
    action_type: 'function',
    outcome: 'applied',
    applied_at: new Date().toISOString(),
    notes: null,
    ...overrides,
  };
}

Deno.test('aggregate: lista vazia retorna 14 dias zerados', () => {
  const agg = aggregate([]);
  assertEquals(agg.perDay.length, 14);
  assertEquals(agg.perDay.every(d => d.count === 0), true);
  assertEquals(Object.keys(agg.byCategory).length, 0);
  assertEquals(Object.keys(agg.byOutcome).length, 0);
});

Deno.test('aggregate: contagens por categoria e outcome', () => {
  const items: ActionRow[] = [
    row({ category: 'infra', outcome: 'auto_applied' }),
    row({ category: 'infra', outcome: 'applied' }),
    row({ category: 'quality', outcome: 'snoozed' }),
    row({ category: 'process', outcome: 'dismissed' }),
    row({ category: 'quality', outcome: 'applied' }),
  ];
  const agg = aggregate(items);
  assertEquals(agg.byCategory.infra, 2);
  assertEquals(agg.byCategory.quality, 2);
  assertEquals(agg.byCategory.process, 1);
  assertEquals(agg.byOutcome.applied, 2);
  assertEquals(agg.byOutcome.auto_applied, 1);
  assertEquals(agg.byOutcome.snoozed, 1);
  assertEquals(agg.byOutcome.dismissed, 1);
});

Deno.test('aggregate: perDay em ordem cronológica ascendente', () => {
  const agg = aggregate([]);
  const dates = agg.perDay.map(d => d.date);
  const sorted = [...dates].sort();
  assertEquals(dates, sorted);
  // Última data deve ser hoje (UTC)
  const today = new Date().toISOString().slice(0, 10);
  assertEquals(dates[dates.length - 1], today);
});

Deno.test('aggregate: contabiliza ação no dia correto', () => {
  const today = new Date().toISOString().slice(0, 10);
  const items = [
    row({ applied_at: `${today}T10:00:00.000Z` }),
    row({ applied_at: `${today}T15:30:00.000Z` }),
  ];
  const agg = aggregate(items);
  const todayBucket = agg.perDay.find(d => d.date === today);
  assert(todayBucket, 'bucket de hoje deve existir');
  assertEquals(todayBucket!.count, 2);
});
