import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAgentStatus } from '../useAgentStatus';

const fromMock = vi.fn();
const channelObj: { on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> } = {
  on: vi.fn(() => channelObj),
  subscribe: vi.fn(() => channelObj),
};
const getSessionMock = vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } });
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: unknown[]) => fromMock(...a),
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn(),
    auth: { getSession: (...a: unknown[]) => getSessionMock(...a) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));

const agents = [
  { id: 'a1', name: 'Alice', extension: '100', email: null, status: 'available', department: null },
  { id: 'a2', name: 'Bob', extension: '101', email: null, status: 'busy', department: null },
];

describe('useAgentStatus (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fromMock.mockReturnValue({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: agents, error: null }) })),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    });
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it('fetches agents on mount', async () => {
    const { result } = renderHook(() => useAgentStatus());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.agents).toHaveLength(2);
  });

  it('setAgent selects and toasts; clearAgent clears', async () => {
    const { result } = renderHook(() => useAgentStatus());
    await waitFor(() => expect(result.current.agents).toHaveLength(2));
    act(() => result.current.setAgent('a1'));
    await waitFor(() => expect(result.current.currentAgent?.id).toBe('a1'));
    expect(localStorage.getItem('currentAgentId')).toBe('a1');
    act(() => result.current.clearAgent());
    await waitFor(() => expect(result.current.currentAgent).toBeNull());
  });

  it('updateStatus returns false without selected agent', async () => {
    const { result } = renderHook(() => useAgentStatus());
    await waitFor(() => expect(result.current.agents).toHaveLength(2));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.updateStatus('busy'); });
    expect(ok).toBe(false);
  });

  it('status helper updates succeed when agent selected', async () => {
    const { result } = renderHook(() => useAgentStatus());
    await waitFor(() => expect(result.current.agents).toHaveLength(2));
    act(() => result.current.setAgent('a1'));
    await waitFor(() => expect(result.current.currentAgentId).toBe('a1'));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.setStatusBusy(); });
    expect(ok).toBe(true);
    await act(async () => { await result.current.setStatusAvailable(); });
    await act(async () => { await result.current.setStatusAway(); });
    await act(async () => { await result.current.setStatusOffline(); });
  });

  it('updateStatus handles supabase error', async () => {
    const { result } = renderHook(() => useAgentStatus());
    await waitFor(() => expect(result.current.agents).toHaveLength(2));
    act(() => result.current.setAgent('a1'));
    await waitFor(() => expect(result.current.currentAgentId).toBe('a1'));
    fromMock.mockReturnValue({ update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: new Error('upd') }) })) });
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.updateStatus('away'); });
    expect(ok).toBe(false);
  });

  it('fetchAgents handles error gracefully', async () => {
    fromMock.mockReturnValue({ select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: null, error: new Error('fetch') }) })) });
    const { result } = renderHook(() => useAgentStatus());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.agents).toEqual([]);
  });
});
