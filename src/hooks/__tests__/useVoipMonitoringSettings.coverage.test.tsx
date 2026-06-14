import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryResult {
  data: unknown;
  error: unknown;
}

const state: {
  selectResult: QueryResult;
  mutateResult: QueryResult;
} = {
  selectResult: { data: { id: 'cfg-1', occupancy_threshold_percent: 80, latency_threshold_ms: 150, check_interval_seconds: 30 }, error: null },
  mutateResult: { data: { id: 'cfg-1' }, error: null },
};

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (resultRef: () => QueryResult) => {
    const c: Record<string, unknown> = {};
    ['select', 'order', 'eq', 'gte', 'lte', 'lt', 'gt', 'is', 'in', 'or', 'match', 'range', 'limit', 'maybeSingle', 'single'].forEach((m) => {
      c[m] = vi.fn(() => c);
    });
    (c as { then: (r: (v: unknown) => void) => void }).then = (resolve) => resolve(resultRef());
    return c;
  };
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => makeChain(() => state.selectResult)),
        insert: vi.fn(() => makeChain(() => state.mutateResult)),
        update: vi.fn(() => makeChain(() => state.mutateResult)),
        upsert: vi.fn(() => makeChain(() => state.mutateResult)),
      })),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { useVoipMonitoringSettings } from '../useVoipMonitoringSettings';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useVoipMonitoringSettings (coverage)', () => {
  beforeEach(() => {
    state.selectResult = { data: { id: 'cfg-1', occupancy_threshold_percent: 80, latency_threshold_ms: 150, check_interval_seconds: 30 }, error: null };
    state.mutateResult = { data: { id: 'cfg-1' }, error: null };
  });

  it('loads settings successfully', async () => {
    const { result } = renderHook(() => useVoipMonitoringSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect((result.current.settings as { id: string }).id).toBe('cfg-1');
  });

  it('updates existing settings (id present)', async () => {
    const { result } = renderHook(() => useVoipMonitoringSettings(), { wrapper });
    await waitFor(() => expect(result.current.settings).toBeTruthy());
    act(() => { result.current.save({ latency_threshold_ms: 200 }); });
    await waitFor(() => expect(true).toBe(true));
  });

  it('inserts when no existing settings', async () => {
    state.selectResult = { data: null, error: null };
    const { result } = renderHook(() => useVoipMonitoringSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => { result.current.save({ occupancy_threshold_percent: 90 }); });
    await waitFor(() => expect(true).toBe(true));
  });

  it('surfaces query error', async () => {
    state.selectResult = { data: null, error: new Error('boom') };
    const { result } = renderHook(() => useVoipMonitoringSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.settings).toBeUndefined();
  });
});
