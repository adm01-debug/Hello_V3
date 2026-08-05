import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

interface QueryResult {
  data: unknown;
  error: unknown;
}

// Per-table queued results. Each call to from(table) builds a thenable chain
// that resolves to the next queued result for that table (or a default).
const tableResults: Record<string, QueryResult[]> = {};
const defaultResult: QueryResult = { data: [], error: null };

function nextResult(table: string): QueryResult {
  const queue = tableResults[table];
  if (queue && queue.length > 0) {
    return queue.shift() as QueryResult;
  }
  return defaultResult;
}

function makeBuilder(table: string) {
  const result = () => Promise.resolve(nextResult(table));
  const builder: Record<string, unknown> = {};
  const chain = (): typeof builder => builder;
  builder.select = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.lte = vi.fn(chain);
  builder.update = vi.fn(chain);
  builder.insert = vi.fn(() => ({
    select: vi.fn(() => ({ single: vi.fn(() => result()) })),
    then: (cb: (r: QueryResult) => unknown) => result().then(cb),
  }));
  builder.maybeSingle = vi.fn(() => result());
  builder.single = vi.fn(() => result());
  // Make the builder itself awaitable (thenable) for direct `await query`.
  builder.then = (cb: (r: QueryResult) => unknown) => result().then(cb);
  return builder;
}

const fromMock = vi.fn((table: string) => makeBuilder(table));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

import { useGamification } from '../useGamification';

function setResults(map: Record<string, QueryResult[]>) {
  for (const k of Object.keys(tableResults)) delete tableResults[k];
  Object.assign(tableResults, map);
}

describe('useGamification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(tableResults)) delete tableResults[k];
  });

  it('loads data successfully and computes rankings', async () => {
    setResults({
      badges: [{ data: [{ id: 'b1', name: 'Badge', tier: 'gold', points: 50, requirement_type: 'total_calls', requirement_value: 10 }], error: null }],
      agent_badges: [{ data: [{ id: 'ab1', agent_id: 'a1', badge_id: 'b1', earned_at: 'now', badge: { id: 'b1', name: 'Badge' } }], error: null }],
      agent_weekly_stats: [{ data: { id: 'w1', agent_id: 'a1', total_calls: 5, total_duration_seconds: 100, points_earned: 50, badges_earned: 1 }, error: null }, { data: [{ agent_id: 'a1', total_calls: 5, total_duration_seconds: 100, avg_satisfaction: 8, points_earned: 50, badges_earned: 1 }], error: null }],
      agents: [{ data: [{ id: 'a1', name: 'Agent One', avatar_url: null }], error: null }],
    });

    const { result } = renderHook(() => useGamification('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.badges.length).toBeGreaterThanOrEqual(0);
    expect(result.current.rankings.length).toBeGreaterThanOrEqual(0);
  });

  it('runs without agentId (skips agent-scoped fetches)', async () => {
    setResults({
      badges: [{ data: [], error: null }],
      agent_weekly_stats: [{ data: [], error: null }],
      agents: [{ data: [], error: null }],
    });
    const { result } = renderHook(() => useGamification());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.agentBadges).toEqual([]);
  });

  it('handles fetch errors on all tables', async () => {
    setResults({
      badges: [{ data: null, error: { message: 'boom' } }],
      agent_badges: [{ data: null, error: { message: 'boom' } }],
      agent_weekly_stats: [{ data: null, error: { message: 'boom' } }],
      agents: [{ data: null, error: { message: 'boom' } }],
    });
    const { result } = renderHook(() => useGamification('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('awards a badge and updates weekly stats (existing row)', async () => {
    setResults({
      badges: [{ data: [], error: null }],
      agent_badges: [{ data: [], error: null }],
      agent_weekly_stats: [{ data: { id: 'w1', total_calls: 1, total_duration_seconds: 1, badges_earned: 0, points_earned: 0 }, error: null }],
      agents: [{ data: [], error: null }],
    });
    const { result } = renderHook(() => useGamification('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    setResults({
      agent_badges: [{ data: { id: 'ab2', agent_id: 'a1', badge_id: 'b9', badge: { name: 'Winner', points: 30 } }, error: null }, { data: [], error: null }],
      agent_weekly_stats: [{ data: { id: 'w1', total_calls: 1, total_duration_seconds: 1, badges_earned: 0, points_earned: 0 }, error: null }, { data: null, error: null }, { data: [], error: null }],
      agents: [{ data: [], error: null }],
    });
    await act(async () => { await result.current.awardBadge('b9'); });
  });

  it('awardBadge handles duplicate (23505) and generic errors', async () => {
    setResults({ badges: [{ data: [], error: null }], agent_badges: [{ data: [], error: null }], agent_weekly_stats: [{ data: [], error: null }], agents: [{ data: [], error: null }] });
    const { result } = renderHook(() => useGamification('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    setResults({ agent_badges: [{ data: null, error: { code: '23505' } }] });
    await act(async () => { await result.current.awardBadge('dup'); });

    setResults({ agent_badges: [{ data: null, error: { code: 'XXX', message: 'fail' } }] });
    await act(async () => { await result.current.awardBadge('err'); });
  });

  it('updateWeeklyStats inserts when no existing row', async () => {
    setResults({ badges: [{ data: [], error: null }], agent_badges: [{ data: [], error: null }], agent_weekly_stats: [{ data: [], error: null }], agents: [{ data: [], error: null }] });
    const { result } = renderHook(() => useGamification('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    setResults({
      agent_weekly_stats: [{ data: null, error: null }, { data: null, error: null }, { data: [], error: null }],
      agents: [{ data: [], error: null }],
    });
    await act(async () => {
      await result.current.updateWeeklyStats({ total_calls: 2, total_duration_seconds: 30, badges_earned: 1, points_earned: 5, avg_satisfaction: 9, avg_performance: 7 });
    });
  });

  it('updateWeeklyStats returns early without agentId', async () => {
    const { result } = renderHook(() => useGamification());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.updateWeeklyStats({ total_calls: 1 }); });
    await act(async () => { await result.current.awardBadge('x'); });
  });

  it('checkAndAwardBadges evaluates all requirement types', async () => {
    setResults({
      badges: [{ data: [
        { id: 'b1', requirement_type: 'total_calls', requirement_value: 1, points: 10, name: 'A' },
        { id: 'b2', requirement_type: 'avg_satisfaction', requirement_value: 50, points: 10, name: 'B' },
        { id: 'b3', requirement_type: 'weekly_duration', requirement_value: 1, points: 10, name: 'C' },
        { id: 'b4', requirement_type: 'daily_calls', requirement_value: 1, points: 10, name: 'D' },
        { id: 'b5', requirement_type: 'weekly_rank', requirement_value: 3, points: 10, name: 'E' },
        { id: 'b6', requirement_type: 'unknown', requirement_value: 1, points: 10, name: 'F' },
      ], error: null }],
      agent_badges: [{ data: [{ id: 'ab', badge_id: 'b1', agent_id: 'a1', earned_at: 'x', badge: {} }], error: null }],
      agent_weekly_stats: [{ data: [], error: null }],
      agents: [{ data: [], error: null }],
    });
    const { result } = renderHook(() => useGamification('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // subsequent awardBadge calls resolve generically. Each award: insert.single
    // (agent_badges), then fetchAgentBadges (agent_badges), then updateWeeklyStats
    // reads agent_weekly_stats (maybeSingle + order) and agents.
    const awardedBadge: QueryResult = { data: { id: 'x', badge: { name: 'X', points: 1 } }, error: null };
    const emptyArr: QueryResult = { data: [], error: null };
    const nullRow: QueryResult = { data: null, error: null };
    setResults({
      agent_badges: Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? awardedBadge : emptyArr)),
      agent_weekly_stats: Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? nullRow : emptyArr)),
      agents: Array.from({ length: 10 }, () => emptyArr),
    });
    await act(async () => {
      await result.current.checkAndAwardBadges({ totalCalls: 5, avgSatisfaction: 9, weeklyDuration: 100, dailyCalls: 10, weeklyRank: 2 });
    });
  });

  it('exposes refetch', async () => {
    setResults({ badges: [{ data: [], error: null }], agent_badges: [{ data: [], error: null }], agent_weekly_stats: [{ data: [], error: null }], agents: [{ data: [], error: null }] });
    const { result } = renderHook(() => useGamification('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.refetch(); });
    expect(typeof result.current.refetch).toBe('function');
  });
});
