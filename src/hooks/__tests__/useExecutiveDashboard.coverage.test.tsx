import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

interface QueryResult { data: unknown; error: unknown; }

const tableResults: Record<string, QueryResult> = {};

function makeBuilder(table: string) {
  const result = () => Promise.resolve(tableResults[table] ?? { data: [], error: null });
  const builder: Record<string, unknown> = {};
  const chain = (): typeof builder => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.lte = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.then = (cb: (r: QueryResult) => unknown) => result().then(cb);
  return builder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => makeBuilder(table)),
    channel: vi.fn(() => {
      const ch: Record<string, unknown> = {};
      ch.on = vi.fn(() => ch);
      ch.subscribe = vi.fn(() => ch);
      return ch;
    }),
    removeChannel: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import {
  useExecutiveDashboardData,
  getPeriodLabel,
  formatDuration,
  type PeriodType,
} from '../useExecutiveDashboard';

function setResults(map: Record<string, QueryResult>) {
  for (const k of Object.keys(tableResults)) delete tableResults[k];
  Object.assign(tableResults, map);
}

function nowISO(daysAgo = 0): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

describe('useExecutiveDashboard helpers', () => {
  it('getPeriodLabel covers all periods and fallback', () => {
    expect(getPeriodLabel('today')).toBe('hoje');
    expect(getPeriodLabel('week')).toContain('7');
    expect(getPeriodLabel('month')).toContain('30');
    expect(getPeriodLabel('all')).toContain('período');
    expect(getPeriodLabel('weird' as PeriodType)).toContain('7');
  });

  it('formatDuration formats minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0m 0s');
    expect(formatDuration(125)).toBe('2m 5s');
  });
});

describe('useExecutiveDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(tableResults)) delete tableResults[k];
  });

  it('computes metrics with full datasets (week period)', async () => {
    setResults({
      call_sessions: {
        data: [
          { id: 's1', agent_name: 'Alice', status: 'completed', duration_seconds: 120, created_at: nowISO(1) },
          { id: 's2', agent_name: 'Bob', status: 'in_progress', duration_seconds: 60, created_at: nowISO(2) },
          { id: 's3', agent_name: 'Alice', status: 'completed', duration_seconds: 0, created_at: nowISO(10) },
          { id: 's4', agent_name: null, status: 'completed', duration_seconds: 30, created_at: nowISO(0) },
        ],
        error: null,
      },
      call_summaries: {
        data: [
          { call_session_id: 's1', customer_satisfaction: 9, agent_performance_score: 8, overall_sentiment: 'positive' },
          { call_session_id: 's2', customer_satisfaction: 5, agent_performance_score: 6, overall_sentiment: 'neutral' },
          { call_session_id: 's3', customer_satisfaction: null, agent_performance_score: null, overall_sentiment: 'negative' },
        ],
        error: null,
      },
      call_alerts: {
        data: [
          { severity: 'critical', alert_type: 'hold_too_long', title: 'Espera longa' },
          { severity: 'warning', alert_type: 'other', title: 'Aviso' },
        ],
        error: null,
      },
      agent_goals: {
        data: [
          { agent_name: 'Alice', calls_target: 10, satisfaction_target: '8.5', performance_target: '8.0' },
        ],
        error: null,
      },
      hold_events: {
        data: [
          { agent_name: 'Alice', duration_seconds: 40, call_session_id: 's1' },
          { agent_name: 'Bob', duration_seconds: 20, call_session_id: 's2' },
          { agent_name: null, duration_seconds: 10, call_session_id: 's3' },
        ],
        error: null,
      },
    });

    const { result } = renderHook(() => useExecutiveDashboardData('week'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.metrics.totalCalls).toBe(4);
    expect(result.current.metrics.totalAgents).toBeGreaterThanOrEqual(2);
    expect(result.current.topAgents.length).toBeGreaterThan(0);
    expect(result.current.holdByAgent.length).toBeGreaterThan(0);
    expect(result.current.goalsComparison.length).toBe(1);
    expect(result.current.sentimentData.length).toBe(3);
    expect(result.current.callsByDay.length).toBeGreaterThan(0);
    expect(result.current.satisfactionTrend.length).toBeGreaterThan(0);
  });

  it('handles "all" period (no date filter) and empty hold/goals', async () => {
    setResults({
      call_sessions: { data: [{ id: 'x', agent_name: 'Z', status: 'completed', duration_seconds: 10, created_at: nowISO(0) }], error: null },
      call_summaries: { data: [], error: null },
      call_alerts: { data: [], error: null },
      agent_goals: { data: [], error: null },
      hold_events: { data: [], error: null },
    });
    const { result } = renderHook(() => useExecutiveDashboardData('all'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.metrics.totalCalls).toBe(1);
    expect(result.current.goalsComparison).toEqual([]);
  });

  it('handles "today" period and null sessions (early return)', async () => {
    setResults({
      call_sessions: { data: null, error: { message: 'fail' } },
      call_summaries: { data: null, error: null },
      call_alerts: { data: null, error: null },
      agent_goals: { data: null, error: null },
      hold_events: { data: null, error: null },
    });
    const { result } = renderHook(() => useExecutiveDashboardData('today'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.metrics.totalCalls).toBe(0);
  });

  it('handles "month" period', async () => {
    setResults({
      call_sessions: { data: [], error: null },
      call_summaries: { data: [], error: null },
      call_alerts: { data: [], error: null },
      agent_goals: { data: [], error: null },
      hold_events: { data: [], error: null },
    });
    const { result } = renderHook(() => useExecutiveDashboardData('month'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.metrics.totalCalls).toBe(0);
  });
});
