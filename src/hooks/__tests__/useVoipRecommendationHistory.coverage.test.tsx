import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVoipRecommendationHistory, type VoipRecommendationHistoryResponse } from '../useVoipRecommendationHistory';

const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/tracing', () => ({
  withTrace: (_op: string, fn: () => unknown) => fn(),
  traceHeaders: () => ({ 'x-request-id': 'test' }),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const sample: VoipRecommendationHistoryResponse = {
  period: 'week',
  since: '2024-01-01',
  items: [],
  total: 0,
  aggregations: { byCategory: {}, byOutcome: {}, perDay: [] },
  requestId: 'req-1',
};

beforeEach(() => vi.clearAllMocks());

describe('useVoipRecommendationHistory', () => {
  it('returns data on success with default options', async () => {
    invoke.mockResolvedValue({ data: sample, error: null });
    const { result } = renderHook(() => useVoipRecommendationHistory(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.requestId).toBe('req-1');
    expect(invoke).toHaveBeenCalledWith('voip-recommendation-history', expect.objectContaining({
      method: 'GET',
      query: { period: 'week', limit: '50' },
    }));
  });

  it('passes custom period and limit', async () => {
    invoke.mockResolvedValue({ data: { ...sample, period: 'day' }, error: null });
    const { result } = renderHook(() => useVoipRecommendationHistory({ period: 'day', limit: 10 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invoke).toHaveBeenCalledWith('voip-recommendation-history', expect.objectContaining({
      query: { period: 'day', limit: '10' },
    }));
  });

  it('errors when invoke returns error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useVoipRecommendationHistory({ limit: 25 }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 10000 });
  });

  it('does not run query when disabled', () => {
    const { result } = renderHook(() => useVoipRecommendationHistory({ enabled: false }), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(invoke).not.toHaveBeenCalled();
  });
});
