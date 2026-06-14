import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const invokeMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    auth: { getSession: (...args: unknown[]) => getSessionMock(...args) },
  },
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => {
  const sub = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return {
    logger: { create: vi.fn(() => sub), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    generateRequestId: vi.fn(() => 'req-1'),
    setRequestId: vi.fn(),
    clearRequestId: vi.fn(),
    getRequestId: vi.fn(() => 'req-1'),
  };
});

import { useVoipQualityForecast, useVoipQualityForecastFetch } from '@/hooks/useVoipQualityForecast';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const payload = {
  horizon_hours: 24,
  generated_at: '2026-06-14T00:00:00Z',
  history_points: 100,
  forecast: [],
  summary: { avg_mos_predicted: 4.2, risk_windows: 1, p95_volume_historical: 50, trend_slope_mos: -0.01 },
};

describe('useVoipQualityForecast', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    getSessionMock.mockReset();
  });

  it('returns forecast payload via functions.invoke', async () => {
    invokeMock.mockResolvedValue({ data: payload, error: null });
    const { result } = renderHook(() => useVoipQualityForecast(24), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payload);
  });

  it('throws on invoke error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('fail') });
    const { result } = renderHook(() => useVoipQualityForecast(72), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useVoipQualityForecastFetch', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it('fetches via direct fetch with session token', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useVoipQualityForecastFetch(168), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payload);
    expect(fetchMock).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('throws when no session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useVoipQualityForecastFetch(24), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('throws on non-ok response', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, json: vi.fn() });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useVoipQualityForecastFetch(24), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    vi.unstubAllGlobals();
  });
});
