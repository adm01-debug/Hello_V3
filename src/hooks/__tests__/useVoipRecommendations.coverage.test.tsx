import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

import { useVoipRecommendations } from '../useVoipRecommendations';

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const sampleResponse = {
  period: 'week',
  since: '2026-06-01',
  recommendations: [],
  total: 0,
  context: {
    slaPct: null,
    avgMos: null,
    avgJitter: null,
    unackAlerts: 0,
    totalAlerts: 0,
    peakConcurrent: 0,
    worstAgent: null,
    totalCalls: 0,
  },
  requestId: 'req-1',
};

describe('useVoipRecommendations', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('loads recommendations successfully', async () => {
    invokeMock.mockResolvedValue({ data: sampleResponse, error: null });
    const { result } = renderHook(() => useVoipRecommendations('week'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.requestId).toBe('req-1');
    expect(invokeMock).toHaveBeenCalledWith(
      'voip-recommendations',
      expect.objectContaining({ method: 'GET', query: { period: 'week' } }),
    );
  });

  it('defaults period to week and supports day', async () => {
    invokeMock.mockResolvedValue({ data: { ...sampleResponse, period: 'day' }, error: null });
    const { result } = renderHook(() => useVoipRecommendations('day'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invokeMock).toHaveBeenCalledWith(
      'voip-recommendations',
      expect.objectContaining({ query: { period: 'day' } }),
    );
  });

  it('throws and surfaces error when invoke returns error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail', status: 403 } });
    const { result } = renderHook(() => useVoipRecommendations('week'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
