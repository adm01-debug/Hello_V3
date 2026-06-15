import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHoldMetrics } from '../useHoldMetrics';

interface QueryResult { data: unknown; error: unknown }
const responses: Record<string, QueryResult> = {
  hold_events: { data: [], error: null },
  call_sessions: { data: [], error: null },
  agents: { data: [], error: null },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({ lte: vi.fn(() => ({ order: vi.fn(() => Promise.resolve(responses[table])) })) })),
        order: vi.fn(() => Promise.resolve(responses[table])),
      })),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useHoldMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const today = new Date().toISOString();
    responses.hold_events = { data: [
      { agent_name: 'Bob', call_session_id: 'c1', duration_seconds: 120, created_at: today },
      { agent_name: 'Bob', call_session_id: 'c2', duration_seconds: 60, created_at: today },
    ], error: null };
    responses.call_sessions = { data: [
      { agent_name: 'Bob', created_at: today }, { agent_name: 'Bob', created_at: today },
    ], error: null };
    responses.agents = { data: [{ name: 'Bob' }, { name: 'Idle' }], error: null };
  });

  it('aggregates 7d metrics', async () => {
    const { result } = renderHook(() => useHoldMetrics('7d'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.agentMetrics.length).toBe(2);
    expect(result.current.totalHoldTimeOverall).toBe(180);
    expect(result.current.avgHoldTimeOverall).toBe(90);
    expect(result.current.holdRateOverall).toBeGreaterThan(0);
    expect(result.current.bestPerformer?.agentName).toBe('Bob');
    expect(result.current.dailyMetrics.length).toBe(7);
    expect(result.current.pieData.length).toBeGreaterThan(0);
  });

  it('handles 30d and 90d ranges with empty data', async () => {
    responses.hold_events = { data: [], error: null };
    responses.call_sessions = { data: [], error: null };
    responses.agents = { data: [], error: null };
    const { result } = renderHook(() => useHoldMetrics('30d'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dailyMetrics.length).toBe(30);
    expect(result.current.avgHoldTimeOverall).toBe(0);
    expect(result.current.bestPerformer).toBeUndefined();
  });

  it('handles 90d range', async () => {
    const { result } = renderHook(() => useHoldMetrics('90d'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dailyMetrics.length).toBe(90);
  });
});
