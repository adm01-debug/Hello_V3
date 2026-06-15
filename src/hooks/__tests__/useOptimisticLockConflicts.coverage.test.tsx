import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOptimisticLockConflicts } from '../useOptimisticLockConflicts';

const rows = [
  { id: '1', table_name: 'deals', record_id: 'r1', user_id: 'u1', client_version: 1, current_version: 2, attempted_at: '2026-06-13T10:00:00Z' },
  { id: '2', table_name: 'deals', record_id: 'r2', user_id: 'u1', client_version: 1, current_version: 2, attempted_at: '2026-06-13T11:00:00Z' },
  { id: '3', table_name: 'contacts', record_id: 'r3', user_id: null, client_version: 1, current_version: 2, attempted_at: '2026-06-12T11:00:00Z' },
];

const state = { error: null as unknown };
const eqSpy = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn().mockReturnValue(builder);
      builder.gte = vi.fn().mockReturnValue(builder);
      builder.order = vi.fn().mockReturnValue(builder);
      builder.limit = vi.fn().mockReturnValue(builder);
      builder.eq = vi.fn((...args: unknown[]) => {
        eqSpy(...args);
        return builder;
      });
      builder.then = (r: (v: unknown) => unknown) =>
        Promise.resolve({ data: rows, error: state.error }).then(r);
      return builder;
    }),
  },
}));

vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  state.error = null;
  eqSpy.mockClear();
});

describe('useOptimisticLockConflicts', () => {
  it('aggregates stats for default 24h period', async () => {
    const { result } = renderHook(() => useOptimisticLockConflicts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const d = result.current.data!;
    expect(d.total).toBe(3);
    expect(d.topTables[0]).toEqual({ table_name: 'deals', count: 2 });
    expect(d.topUsers[0]).toEqual({ user_id: 'u1', count: 2 });
    expect(d.timeline.length).toBe(2);
    expect(d.recent.length).toBe(3);
  });

  it('applies table filter via eq', async () => {
    const { result } = renderHook(() => useOptimisticLockConflicts('7d', 'deals'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eqSpy).toHaveBeenCalledWith('table_name', 'deals');
  });

  it('does not filter when tableFilter is "all"', async () => {
    const { result } = renderHook(() => useOptimisticLockConflicts('30d', 'all'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eqSpy).not.toHaveBeenCalled();
  });

  it('surfaces error', async () => {
    state.error = new Error('db fail');
    const { result } = renderHook(() => useOptimisticLockConflicts('24h'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
