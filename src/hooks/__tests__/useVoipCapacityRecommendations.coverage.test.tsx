import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface SessionResult {
  data: { session: { access_token: string } | null };
}

const state: { session: SessionResult } = {
  session: { data: { session: { access_token: 'tok-123' } } },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve(state.session)),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { useVoipCapacityRecommendations } from '../useVoipCapacityRecommendations';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useVoipCapacityRecommendations (coverage)', () => {
  beforeEach(() => {
    state.session = { data: { session: { access_token: 'tok-123' } } };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches recommendations successfully (default horizon)', async () => {
    const payload = {
      recommendations: [],
      confidence: 0.9,
      generated_at: '2026-01-01T00:00:00Z',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payload) } as Response)),
    );
    const { result } = renderHook(() => useVoipCapacityRecommendations(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((result.current.data as { confidence: number }).confidence).toBe(0.9);
  });

  it('passes a custom forecast horizon', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ recommendations: [], confidence: 1, generated_at: 'x' }) } as Response),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useVoipCapacityRecommendations(168), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(((fetchMock.mock.calls[0] as unknown[])[0] as string)).toContain('horizon=168');
  });

  it('errors when there is no session', async () => {
    state.session = { data: { session: null } };
    vi.stubGlobal('fetch', vi.fn());
    const { result } = renderHook(() => useVoipCapacityRecommendations(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Sem sessão');
  });

  it('errors on non-ok HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response)),
    );
    const { result } = renderHook(() => useVoipCapacityRecommendations(72), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('HTTP 500');
  });
});
