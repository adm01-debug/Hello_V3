import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { useVoipRecommendationInsights } from '../useVoipRecommendationInsights';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const sample = {
  period: 'week',
  since: '2026-01-01',
  effectivenessPct: 50,
  effectivenessSampleSize: 10,
  recurringCategories: [],
  topProblematic: [],
  pendingSnoozed: 0,
  heatmap: [],
  totals: { applied: 1, autoApplied: 0, snoozed: 0, dismissed: 0 },
  requestId: 'r1',
};

describe('useVoipRecommendationInsights', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carrega insights com sucesso (default week)', async () => {
    invokeMock.mockResolvedValue({ data: sample, error: null });
    const { result } = renderHook(() => useVoipRecommendationInsights(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.requestId).toBe('r1');
    expect(invokeMock).toHaveBeenCalledWith(
      'voip-recommendation-insights',
      expect.objectContaining({ method: 'GET', query: { period: 'week' } }),
    );
  });

  it('aceita período month', async () => {
    invokeMock.mockResolvedValue({ data: { ...sample, period: 'month' }, error: null });
    const { result } = renderHook(() => useVoipRecommendationInsights('month'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeMock).toHaveBeenCalledWith(
      'voip-recommendation-insights',
      expect.objectContaining({ query: { period: 'month' } }),
    );
  });

  it('propaga erro da edge function', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail', status: 404 } });
    const { result } = renderHook(() => useVoipRecommendationInsights(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
