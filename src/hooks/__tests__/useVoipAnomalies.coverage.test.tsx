import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => {
  const sub = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return {
    logger: { create: vi.fn(() => sub), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
});

import { useVoipAnomalies } from '@/hooks/useVoipAnomalies';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useVoipAnomalies', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('classifies anomalies (outage/drift/spike) and builds ids', async () => {
    invokeMock.mockResolvedValue({
      data: {
        window_hours: 24,
        baseline_samples: 100,
        anomalies: [
          // mos outage
          { metric: 'mos', expected: 4, observed: 2.0, std: 0.5, z_score: -4, severity: 'critical', started_at: '2026-06-14T10:00:00Z', bucket_hour: 10, bucket_dow: 1 },
          // volume outage
          { metric: 'volume', expected: 50, observed: 0, std: 5, z_score: -10, severity: 'critical', started_at: '2026-06-14T11:00:00Z', bucket_hour: 11, bucket_dow: 1 },
          // drift (abs z between 2.5 and 3.5)
          { metric: 'jitter', expected: 10, observed: 30, std: 5, z_score: 3.0, severity: 'warning', started_at: '2026-06-14T12:00:00Z', bucket_hour: 12, bucket_dow: 1 },
          // spike (default)
          { metric: 'mos', expected: 4, observed: 3.5, std: 0.2, z_score: 5, severity: 'warning', started_at: '2026-06-14T13:00:00Z', bucket_hour: 13, bucket_dow: 1 },
        ],
      },
      error: null,
    });

    const { result } = renderHook(() => useVoipAnomalies(24), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const kinds = result.current.data!.map((a) => a.kind);
    expect(kinds).toEqual(['outage', 'outage', 'drift', 'spike']);
    expect(result.current.data![0].id).toContain('mos-1-10-');
  });

  it('returns empty array when no anomalies present', async () => {
    invokeMock.mockResolvedValue({ data: { anomalies: null, window_hours: 24, baseline_samples: 0 }, error: null });
    const { result } = renderHook(() => useVoipAnomalies(48), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('boom') });
    const { result } = renderHook(() => useVoipAnomalies(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
