import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQualityMetrics, useTrunkUsageMetrics } from '../useQualityMetrics';

interface QueryResult { data: unknown; error: unknown }
const responses: Record<string, QueryResult> = {
  call_quality_metrics: { data: [], error: null },
  voip_trunk_usage_metrics: { data: [], error: null },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(() => Promise.resolve(responses[table])),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useQualityMetrics / useTrunkUsageMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responses.call_quality_metrics = { data: [{ id: 'q1', agent_name: 'A', mos_avg: 4.2 }], error: null };
    responses.voip_trunk_usage_metrics = { data: [{ id: 'u1', trunk_id: 't1' }], error: null };
  });

  it('loads quality metrics', async () => {
    const { result } = renderHook(() => useQualityMetrics(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
  });

  it('loads trunk usage metrics', async () => {
    const { result } = renderHook(() => useTrunkUsageMetrics(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].trunk_id).toBe('t1');
  });

  it('propagates errors', async () => {
    responses.call_quality_metrics = { data: null, error: new Error('x') };
    const { result } = renderHook(() => useQualityMetrics(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
