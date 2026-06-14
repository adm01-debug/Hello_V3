import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrunkMetrics } from '../useTrunkMetrics';

interface QueryResult { data: unknown; error: unknown }
const responses: Record<string, QueryResult> = {
  voip_trunk_usage_metrics: { data: [], error: null },
  voip_trunks: { data: [], error: null },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn(() => Promise.resolve(responses[table])),
        then: (res: (v: QueryResult) => unknown) => Promise.resolve(responses[table]).then(res),
      };
      return builder;
    }),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useTrunkMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responses.voip_trunk_usage_metrics = { data: [], error: null };
    responses.voip_trunks = { data: [], error: null };
  });

  it('aggregates usage by trunk and by day', async () => {
    responses.voip_trunks = { data: [{ id: 't1', name: 'Trunk A' }], error: null };
    responses.voip_trunk_usage_metrics = {
      data: [
        { trunk_id: 't1', duration_seconds: 120, was_failover: true, started_at: '2026-06-10T10:00:00Z' },
        { trunk_id: 't1', duration_seconds: 60, was_failover: false, started_at: '2026-06-10T11:00:00Z' },
        { trunk_id: 't2', duration_seconds: null, was_failover: false, started_at: '2026-06-11T11:00:00Z' },
      ],
      error: null,
    };
    const { result } = renderHook(() => useTrunkMetrics(7), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.summary.length).toBe(2);
    const t1 = result.current.data?.summary.find(s => s.trunk_id === 't1');
    expect(t1?.total_calls).toBe(2);
    expect(t1?.failover_rate).toBeCloseTo(0.5);
    expect(result.current.data?.daily.length).toBeGreaterThan(0);
  });

  it('returns empty for no data with default days', async () => {
    const { result } = renderHook(() => useTrunkMetrics(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.summary).toEqual([]);
  });

  it('throws on usage error', async () => {
    responses.voip_trunk_usage_metrics = { data: null, error: new Error('boom') };
    const { result } = renderHook(() => useTrunkMetrics(30), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
