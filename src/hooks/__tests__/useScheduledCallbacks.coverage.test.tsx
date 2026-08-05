import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

interface QueryResult { data?: unknown; error: unknown; count?: number | null; }

// Per-operation results keyed by a logical operation name.
let selectResult: QueryResult = { data: [], error: null };
let countResult: QueryResult = { count: 0, error: null };
let insertResult: QueryResult = { data: null, error: null };
let updateResult: QueryResult = { error: null };
let deleteResult: QueryResult = { error: null };

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = (): typeof builder => builder;

  // select() may be used both for list queries (awaited / .order chain) and
  // for count queries (head: true). We detect count via the options arg.
  let isCount = false;
  builder.select = vi.fn((_cols?: unknown, opts?: { count?: string; head?: boolean }) => {
    if (opts && opts.count) isCount = true;
    return builder;
  });
  builder.order = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.lte = vi.fn(chain);
  builder.single = vi.fn(() => Promise.resolve(insertResult));
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => {
    // update().eq(...) is awaited directly by complete/cancel, but
    // updateCallback chains .eq().select().single(). So eq() returns an object
    // that is both thenable (resolves updateResult) and chainable.
    const afterEq: Record<string, unknown> = {};
    afterEq.select = vi.fn(() => ({ single: vi.fn(() => Promise.resolve(insertResult)) }));
    afterEq.then = (cb: (r: QueryResult) => unknown) => Promise.resolve(updateResult).then(cb);
    const upd: Record<string, unknown> = {};
    upd.eq = vi.fn(() => afterEq);
    return upd;
  });
  builder.delete = vi.fn(() => {
    const del: Record<string, unknown> = {};
    del.eq = vi.fn(() => Promise.resolve(deleteResult));
    return del;
  });
  builder.then = (cb: (r: QueryResult) => unknown) =>
    Promise.resolve(isCount ? countResult : selectResult).then(cb);
  return builder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => makeBuilder()),
    channel: vi.fn(() => {
      const ch: Record<string, unknown> = {};
      ch.on = vi.fn(() => ch);
      ch.subscribe = vi.fn(() => ch);
      return ch;
    }),
    removeChannel: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

import { useScheduledCallbacks } from '../useScheduledCallbacks';

const sampleCb = {
  id: 'c1', contact_id: null, caller_name: 'John', caller_phone: '12345',
  scheduled_at: '2026-06-14T10:00:00Z', notes: null, status: 'pending',
  priority: 'normal', assigned_agent: null, created_by: null,
  completed_at: null, created_at: '', updated_at: '',
};

describe('useScheduledCallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResult = { data: [sampleCb], error: null };
    countResult = { count: 3, error: null };
    insertResult = { data: sampleCb, error: null };
    updateResult = { error: null };
    deleteResult = { error: null };
  });

  it('loads pending callbacks and upcoming count on mount', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.callbacks.length).toBe(1);
    await waitFor(() => expect(result.current.upcomingCount).toBe(3));
  });

  it('fetchCallbacks with status filter and error branch', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.fetchCallbacks('completed'); });

    selectResult = { data: null, error: { message: 'boom' } };
    await act(async () => {
      const res = await result.current.fetchCallbacks();
      expect(res).toEqual([]);
    });
  });

  it('fetchUpcomingCount error branch', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    countResult = { count: null, error: { message: 'fail' } };
    await act(async () => { await result.current.fetchUpcomingCount(); });
  });

  it('createCallback success and error', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const created = await result.current.createCallback({
        caller_name: 'Jane', caller_phone: '999', scheduled_at: '2026-06-14T11:00:00Z',
        notes: 'n', priority: 'high', assigned_agent: 'a1', created_by: 'u1', contact_id: 'ct1',
      });
      expect(created).not.toBeNull();
    });

    // minimal input (defaults) + error
    insertResult = { data: null, error: { message: 'insert-fail' } };
    await act(async () => {
      const created = await result.current.createCallback({
        caller_name: 'X', caller_phone: '1', scheduled_at: '2026-06-14T12:00:00Z',
      });
      expect(created).toBeNull();
    });
  });

  it('updateCallback success and error', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const updated = await result.current.updateCallback('c1', { notes: 'updated', status: 'pending' });
      expect(updated).not.toBeNull();
    });

    insertResult = { data: null, error: { message: 'update-fail' } };
    await act(async () => {
      const updated = await result.current.updateCallback('c1', { status: 'pending' });
      expect(updated).toBeNull();
    });
  });

  it('completeCallback success and error', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      expect(await result.current.completeCallback('c1')).toBe(true);
    });

    updateResult = { error: { message: 'fail' } };
    await act(async () => {
      expect(await result.current.completeCallback('c1')).toBe(false);
    });
  });

  it('cancelCallback success and error', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      expect(await result.current.cancelCallback('c1')).toBe(true);
    });

    updateResult = { error: { message: 'fail' } };
    await act(async () => {
      expect(await result.current.cancelCallback('c1')).toBe(false);
    });
  });

  it('deleteCallback success and error', async () => {
    const { result } = renderHook(() => useScheduledCallbacks());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      expect(await result.current.deleteCallback('c1')).toBe(true);
    });

    deleteResult = { error: { message: 'fail' } };
    await act(async () => {
      expect(await result.current.deleteCallback('c1')).toBe(false);
    });
  });
});
