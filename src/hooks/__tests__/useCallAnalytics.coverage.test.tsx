import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

interface QueryResult {
  data: unknown;
  error: unknown;
}

// Mutable per-table results so each test can drive success / error branches.
const results: { call_sessions: QueryResult; call_summaries: QueryResult } = {
  call_sessions: { data: [], error: null },
  call_summaries: { data: [], error: null },
};

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (table: 'call_sessions' | 'call_summaries') => {
    const c: Record<string, unknown> = {};
    ['select', 'order', 'eq'].forEach((m) => {
      c[m] = vi.fn(() => c);
    });
    (c as { then: (r: (v: QueryResult) => void) => void }).then = (resolve) => resolve(results[table]);
    return c;
  };
  return {
    supabase: {
      from: vi.fn((table: string) => makeChain(table as 'call_sessions' | 'call_summaries')),
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

import { useCallAnalytics } from '@/hooks/useCallAnalytics';

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

beforeEach(() => {
  vi.clearAllMocks();
  results.call_sessions = { data: [], error: null };
  results.call_summaries = { data: [], error: null };
});

describe('useCallAnalytics', () => {
  it('loads data and computes empty stats with no sessions', async () => {
    const { result } = renderHook(() => useCallAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.stats.totalCalls).toBe(0);
    expect(result.current.stats.avgDuration).toBe(0);
    expect(result.current.sentimentChartData).toHaveLength(0);
    expect(result.current.stats.callsByDay).toHaveLength(7);
  });

  it('computes stats across sessions and summaries', async () => {
    results.call_sessions = {
      data: [
        { id: 's1', started_at: iso(daysAgo(1)), duration_seconds: 120, status: 'completed' },
        { id: 's2', started_at: iso(daysAgo(2)), duration_seconds: 60, status: 'completed' },
        { id: 's3', started_at: iso(daysAgo(3)), duration_seconds: null, status: 'completed' },
      ],
      error: null,
    };
    results.call_summaries = {
      data: [
        { call_session_id: 's1', overall_sentiment: 'positive', main_topics: ['billing', 'support'], customer_satisfaction: 5, agent_performance_score: 8 },
        { call_session_id: 's2', overall_sentiment: 'negative', main_topics: ['billing'], customer_satisfaction: 2, agent_performance_score: 4 },
        { call_session_id: 's3', overall_sentiment: 'neutral', main_topics: null, customer_satisfaction: null, agent_performance_score: null },
      ],
      error: null,
    };

    const { result } = renderHook(() => useCallAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.stats.totalCalls).toBe(3);
    expect(result.current.stats.avgDuration).toBe(90); // (120+60)/2
    expect(result.current.stats.avgSatisfaction).toBe(3.5);
    expect(result.current.stats.avgPerformance).toBe(6);
    expect(result.current.stats.sentimentCounts).toEqual({ positive: 1, neutral: 1, negative: 1 });
    expect(result.current.stats.topTopics[0]).toEqual(['billing', 2]);
    expect(result.current.sentimentChartData.length).toBeGreaterThan(0);
  });

  it('filters sessions by date range', async () => {
    results.call_sessions = {
      data: [
        { id: 'recent', started_at: iso(daysAgo(2)), duration_seconds: 100, status: 'completed' },
        { id: 'old', started_at: iso(daysAgo(60)), duration_seconds: 100, status: 'completed' },
      ],
      error: null,
    };
    const { result } = renderHook(() => useCallAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // default 'month' keeps recent, drops 60-day-old
    expect(result.current.stats.totalCalls).toBe(1);

    act(() => result.current.setDateRange('week'));
    expect(result.current.dateRange).toBe('week');
    expect(result.current.stats.totalCalls).toBe(1);

    act(() => result.current.setDateRange('3months'));
    expect(result.current.stats.totalCalls).toBe(2);

    act(() => result.current.setDateRange('all'));
    expect(result.current.stats.totalCalls).toBe(2);
  });

  it('handles a sessions query error gracefully', async () => {
    results.call_sessions = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useCallAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.stats.totalCalls).toBe(0);
  });

  it('handles a summaries query error gracefully', async () => {
    results.call_summaries = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useCallAnalytics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.stats.summariesCount).toBe(0);
  });
});
