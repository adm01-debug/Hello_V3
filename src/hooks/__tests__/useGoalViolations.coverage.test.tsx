import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGoalViolations, type GoalViolation } from '../useGoalViolations';

type Result = { data: unknown[] | null; error: { message: string } | null };

const makeChain = (result: Result) => {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn().mockResolvedValue(result),
  };
  return chain;
};

const channelMock = {
  on: vi.fn(function (this: unknown) { return this; }),
  subscribe: vi.fn(function (this: unknown) { return this; }),
};

const sample: GoalViolation[] = [
  {
    id: 'v1', goal_id: 'g1', goal_name: 'SL', metric_type: 'service_level',
    target_value: 80, actual_value: 60, threshold_type: 'critical',
    deviation_percentage: 25, created_at: new Date().toISOString(),
  },
  {
    id: 'v2', goal_id: 'g2', goal_name: 'AW', metric_type: 'avg_wait_time',
    target_value: 30, actual_value: 50, threshold_type: 'warning',
    deviation_percentage: null, created_at: new Date().toISOString(),
  },
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => makeChain({ data: [], error: null })),
    channel: vi.fn(() => channelMock),
    removeChannel: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    // `create` devolve um logger namespaced: usado por safe-number/safe-date.
    create: vi.fn(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() })),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('useGoalViolations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: sample, error: null }) as never);
  });

  it('fetches violations and processes chart data', async () => {
    const { result } = renderHook(() => useGoalViolations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.violations.length).toBe(2);
    expect(result.current.totalViolations).toBe(2);
    expect(result.current.criticalCount).toBe(1);
    expect(result.current.warningCount).toBe(1);
    expect(result.current.dailyTrends.length).toBeGreaterThan(0);
    expect(result.current.metricBreakdown.length).toBe(2);
  });

  it('subscribes to realtime channel and cleans up', async () => {
    const { unmount } = renderHook(() => useGoalViolations());
    await waitFor(() => expect(supabase.channel).toHaveBeenCalledWith('goal-violations'));
    expect(channelMock.on).toHaveBeenCalled();
    expect(channelMock.subscribe).toHaveBeenCalled();
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ data: null, error: { message: 'err' } }) as never
    );
    const { result } = renderHook(() => useGoalViolations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toast.error).toHaveBeenCalled();
  });

  it('refetches when dateRange changes', async () => {
    const { result } = renderHook(() => useGoalViolations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setDateRange('30'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(supabase.from).toHaveBeenCalledWith('goal_violations');
  });

  it('formatValue handles percentage and time metrics', async () => {
    const { result } = renderHook(() => useGoalViolations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.formatValue(80, 'service_level')).toBe('80%');
    expect(result.current.formatValue(125, 'avg_wait_time')).toBe('2m 5s');
    expect(result.current.formatValue(90, 'avg_handle_time')).toBe('1m 30s');
  });
});
