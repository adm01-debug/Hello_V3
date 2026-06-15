import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useActiveCallsRealtime } from '../useActiveCallsRealtime';

const fromMock = vi.fn();
const channelObj: { on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> } = {
  on: vi.fn(() => channelObj),
  subscribe: vi.fn(() => channelObj),
};
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: unknown[]) => fromMock(...a),
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn(),
  },
}));
vi.mock('@/hooks/useHoldSoundAlert', () => ({
  useHoldSoundAlert: () => ({
    soundEnabled: true,
    toggleSound: vi.fn(),
    settings: { critical_threshold_seconds: 120, warning_threshold_seconds: 60 },
  }),
}));

const calls = [
  { id: 'cs1', caller_name: 'A', caller_phone: '1', agent_name: 'Alice', started_at: new Date().toISOString(), status: 'active', hold_time_seconds: 0, hold_count: 0 },
  { id: 'cs2', caller_name: 'B', caller_phone: '2', agent_name: 'Bob', started_at: new Date().toISOString(), status: 'active', hold_time_seconds: 0, hold_count: 0 },
];
const holds = [
  { id: 'h1', call_session_id: 'cs1', started_at: new Date(Date.now() - 200000).toISOString(), ended_at: null, duration_seconds: null },
];

describe('useActiveCallsRealtime (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation((table: string) => {
      if (table === 'call_sessions') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: calls, error: null }) })) })) };
      }
      return { select: vi.fn(() => ({ is: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: holds, error: null }) })) })) };
    });
  });

  afterEach(() => { vi.useRealTimers(); });

  it('loads active calls and holds, computes derived data', async () => {
    const { result } = renderHook(() => useActiveCallsRealtime());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.agents).toEqual(['Alice', 'Bob']);
    expect(result.current.statusCounts.total).toBe(2);
    expect(result.current.isCallOnHold('cs1')).toBe(true);
    expect(result.current.isCallOnHold('cs2')).toBe(false);
    expect(result.current.getHoldDuration('cs1')).toBeGreaterThan(0);
    expect(result.current.getHoldDuration('cs2')).toBe(0);
    expect(result.current.getHoldSeverity(200)).toBe('critical');
    expect(result.current.getHoldSeverity(80)).toBe('warning');
    expect(result.current.getHoldSeverity(10)).toBe('normal');
  });

  it('filters by selected agent and hold status', async () => {
    const { result } = renderHook(() => useActiveCallsRealtime());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSelectedAgent('Alice'));
    await waitFor(() => expect(result.current.filteredCalls).toHaveLength(1));
    act(() => { result.current.setSelectedAgent('all'); result.current.setSelectedHoldStatus('on_hold'); });
    await waitFor(() => expect(result.current.filteredCalls.every(c => result.current.isCallOnHold(c.id))).toBe(true));
    act(() => result.current.setSelectedHoldStatus('in_call'));
    await waitFor(() => expect(result.current.filteredCalls.every(c => !result.current.isCallOnHold(c.id))).toBe(true));
  });

  it('starts a tick interval when there are active calls', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useActiveCallsRealtime());
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { vi.advanceTimersByTime(1100); });
    expect(result.current.statusCounts.total).toBe(2);
  });
});
