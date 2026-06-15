import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

vi.mock('@/lib/tracing', () => ({
  traceHeaders: () => ({ 'x-request-id': 'test-id' }),
  withTrace: async (_op: string, fn: () => Promise<unknown>) => fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { useVoipRecommendationSimulate } from '../useVoipRecommendationSimulate';

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const sampleResult = {
  recommendationId: 'rec-1',
  delta: { mos: 0.3 },
  baseline: {
    avgMos: 3.8,
    avgJitter: 12,
    avgPacketLoss: 0.5,
    totalAlerts: 4,
    poorAlerts: 1,
    sampleSize: 100,
    uniqueAgents: 5,
  },
  projected: {
    avgMos: 4.1,
    avgJitter: 10,
    avgPacketLoss: 0.4,
    alertsAvoided: 2,
    affectedUsersPct: 30,
  },
  requestId: 'req-sim-1',
};

describe('useVoipRecommendationSimulate', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('simulates a recommendation successfully', async () => {
    invokeMock.mockResolvedValue({ data: sampleResult, error: null });
    const { result } = renderHook(() => useVoipRecommendationSimulate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ recommendationId: 'rec-1', mos: 4.0 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.requestId).toBe('req-sim-1');
    expect(invokeMock).toHaveBeenCalledWith(
      'voip-recommendation-simulate',
      expect.objectContaining({ method: 'POST', body: { recommendationId: 'rec-1', mos: 4.0 } }),
    );
  });

  it('throws when invoke returns an error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useVoipRecommendationSimulate(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ recommendationId: 'rec-err' }),
      ).rejects.toBeTruthy();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
