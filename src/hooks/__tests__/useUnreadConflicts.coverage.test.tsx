import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface CountResult {
  count: number | null;
  error: unknown;
}

const state: { result: CountResult; role: string } = {
  result: { count: 5, error: null },
  role: 'admin',
};

vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (resultRef: () => CountResult) => {
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
        select: vi.fn(() => makeChain(() => state.result)),
      })),
    },
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ profile: { id: 'u1', role: state.role } }),
}));

import { useUnreadConflicts } from '../useUnreadConflicts';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useUnreadConflicts (coverage)', () => {
  beforeEach(() => {
    state.result = { count: 5, error: null };
    state.role = 'admin';
  });

  it('returns the conflict count for admin', async () => {
    const { result } = renderHook(() => useUnreadConflicts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(5);
  });

  it('returns 0 when count is null', async () => {
    state.result = { count: null, error: null };
    const { result } = renderHook(() => useUnreadConflicts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('returns 0 on query error (logged, not thrown)', async () => {
    state.result = { count: null, error: new Error('rls denied') };
    const { result } = renderHook(() => useUnreadConflicts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('is disabled for non-privileged roles', async () => {
    state.role = 'agent';
    const { result } = renderHook(() => useUnreadConflicts(), { wrapper });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(result.current.data).toBeUndefined();
  });
});
