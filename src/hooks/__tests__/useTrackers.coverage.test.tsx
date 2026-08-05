import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTrackers, useTrackerMatches } from '../useTrackers';

interface ThenCb {
  (r: { data: unknown[] | null; error: { message: string } | null }): unknown;
}

const makeBuilder = (result: { data: unknown[] | null; error: { message: string } | null }) => {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn().mockResolvedValue(result),
    then: (cb: ThenCb) => Promise.resolve(cb(result)),
  };
  return builder;
};

const okResult = { data: [{ id: 't1', name: 'A' }], error: null };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeBuilder({ data: [{ id: 't1', name: 'A' }], error: null })) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('useTrackers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads trackers on mount (success)', async () => {
    const { result } = renderHook(() => useTrackers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trackers.length).toBe(1);
  });

  it('logs error when load fails', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeBuilder({ data: null, error: { message: 'boom' } }) as never
    );
    const { result } = renderHook(() => useTrackers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trackers).toEqual([]);
  });

  it('createTracker success path', async () => {
    const { result } = renderHook(() => useTrackers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let ok = false;
    await act(async () => {
      ok = await result.current.createTracker({
        name: 'New', category: 'c', description: null, keywords: ['k'],
        match_type: 'any', is_active: true, color: '#fff',
      });
    });
    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalled();
  });

  it('createTracker error path', async () => {
    const { result } = renderHook(() => useTrackers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeBuilder({ data: null, error: { message: 'fail' } }) as never
    );
    let ok = true;
    await act(async () => {
      ok = await result.current.createTracker({
        name: 'X', category: 'c', description: null, keywords: [],
        match_type: 'all', is_active: false, color: '#000',
      });
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('toggleTracker and refresh', async () => {
    const { result } = renderHook(() => useTrackers());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.toggleTracker('t1', false); });
    await act(async () => { await result.current.refresh(); });
    expect(supabase.from).toHaveBeenCalledWith('trackers');
  });
});

describe('useTrackerMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReturnValue(makeBuilder(okResult) as never);
  });

  it('loads without filters', async () => {
    const { result } = renderHook(() => useTrackerMatches());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.matches.length).toBe(1);
  });

  it('loads with all filters present', async () => {
    const { result } = renderHook(() =>
      useTrackerMatches({ trackerId: 't1', agentName: 'Bob', days: 7 })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.matches.length).toBe(1);
  });

  it('handles error branch', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      makeBuilder({ data: null, error: { message: 'oops' } }) as never
    );
    const { result } = renderHook(() => useTrackerMatches({ days: 1 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.matches).toEqual([]);
  });
});
