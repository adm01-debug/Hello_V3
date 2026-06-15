import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMeetingSummary, useMeetingSummariesList, usePendingActionItems, useAutoMeetingSummary } from '../useMeetingSummary';

interface QueryResult { data: unknown; error: unknown }
let summaryRow: QueryResult = { data: { id: 'm1', call_session_id: 'cs1', status: 'completed', key_points: ['a'], action_items: [{ description: 'x', priority: 'high' }] }, error: null };
let listRows: QueryResult = { data: [{ id: 'm1', call_session_id: 'cs1', action_items: [{ description: 'x' }], status: 'completed', call_sessions: { caller_name: 'C' } }], error: null };
const pendingRows: QueryResult = { data: [{ id: 'm1', call_session_id: 'cs1', action_items: [{ description: 'x' }], generated_at: 't' }], error: null };
const invoke = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });
const updateEq = vi.fn().mockResolvedValue({ error: null });

const channelObj = {
  on: vi.fn(function (this: unknown) { return channelObj; }),
  subscribe: vi.fn(() => channelObj),
};

const buildList = (rows: () => QueryResult) => {
  const q: Record<string, unknown> = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    order: vi.fn(() => q),
    ilike: vi.fn(() => q),
    limit: vi.fn(() => q),
    maybeSingle: vi.fn(() => Promise.resolve(summaryRow)),
    then: (res: (v: QueryResult) => unknown) => Promise.resolve(rows()).then(res),
    update: vi.fn(() => ({ eq: (...a: unknown[]) => updateEq(...a) })),
  };
  return q;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => buildList(() => listRows)),
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useMeetingSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    summaryRow = { data: { id: 'm1', call_session_id: 'cs1', status: 'completed', key_points: ['a'], action_items: [{ description: 'x', priority: 'high' }] }, error: null };
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('loads summary and runs generate/update/share', async () => {
    const { result } = renderHook(() => useMeetingSummary('cs1'), { wrapper });
    await waitFor(() => expect(result.current.summary?.id).toBe('m1'));

    await act(async () => { result.current.generate(true); });
    await act(async () => { result.current.updateContent({ summary: 'edited' }); });
    await act(async () => { result.current.share(['u1']); });
    await waitFor(() => expect(invoke).toHaveBeenCalled());
  });

  it('disabled when no callSessionId', async () => {
    const { result } = renderHook(() => useMeetingSummary(undefined), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.summary).toBeUndefined();
  });

  it('generate handles skipped response', async () => {
    invoke.mockResolvedValue({ data: { skipped: true }, error: null });
    const { result } = renderHook(() => useMeetingSummary('cs1'), { wrapper });
    await waitFor(() => expect(result.current.summary?.id).toBe('m1'));
    await act(async () => { result.current.generate(); });
    await waitFor(() => expect(invoke).toHaveBeenCalled());
  });

  it('generate handles error response', async () => {
    invoke.mockResolvedValue({ data: { error: 'bad' }, error: null });
    const { result } = renderHook(() => useMeetingSummary('cs1'), { wrapper });
    await waitFor(() => expect(result.current.summary?.id).toBe('m1'));
    await act(async () => { result.current.generate(); });
    await waitFor(() => expect(invoke).toHaveBeenCalled());
  });
});

describe('useMeetingSummariesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRows = { data: [{ id: 'm1', call_session_id: 'cs1', action_items: [], status: 'completed', call_sessions: { caller_name: 'C' } }], error: null };
  });

  it('loads list with filters', async () => {
    const { result } = renderHook(() => useMeetingSummariesList({ followUpOnly: true, search: 'foo', limit: 10 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
  });

  it('loads list with no filters', async () => {
    const { result } = renderHook(() => useMeetingSummariesList(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('usePendingActionItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRows = { data: [{ id: 'm1', call_session_id: 'cs1', action_items: [{ description: 'x' }], generated_at: 't' }], error: null };
  });

  it('aggregates pending action items', async () => {
    const { result } = renderHook(() => usePendingActionItems(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.followUps).toBe(1);
  });
});

describe('useAutoMeetingSummary', () => {
  beforeEach(() => { vi.clearAllMocks(); invoke.mockResolvedValue({ data: {}, error: null }); });

  it('triggers summary for long calls', async () => {
    const { result } = renderHook(() => useAutoMeetingSummary(), { wrapper });
    await act(async () => { await result.current.triggerSummary('cs1', 120); });
    expect(invoke).toHaveBeenCalled();
  });

  it('skips short calls', async () => {
    const { result } = renderHook(() => useAutoMeetingSummary(), { wrapper });
    await act(async () => { await result.current.triggerSummary('cs1', 30); });
    expect(invoke).not.toHaveBeenCalled();
  });
});
