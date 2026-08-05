import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Configurable per-table responses
let selectResult: { data: unknown; error?: unknown } = { data: [] };
let mutateResult: { error: unknown } = { error: null };

function makeBuilder() {
  const b: Record<string, unknown> = {};
  b.select = vi.fn(() => b);
  b.order = vi.fn(() => b);
  b.eq = vi.fn(() => b);
  b.limit = vi.fn(() => Promise.resolve(selectResult));
  // select chains that end without limit resolve via then
  b.then = (resolve: (v: unknown) => void) => resolve(selectResult);
  b.insert = vi.fn(() => Promise.resolve(mutateResult));
  b.update = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(mutateResult)) }));
  b.delete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(mutateResult)) }));
  return b;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeBuilder()) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useIPWhitelist } from '../useIPWhitelist';
import { toast } from 'sonner';

describe('useIPWhitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResult = { data: [{ id: '1', ip_address: '1.1.1.1', user_id: 'u1', full_name: 'X', email: 'e' }] };
    mutateResult = { error: null };
  });

  it('does not fetch when not admin', () => {
    const { result } = renderHook(() => useIPWhitelist(false));
    expect(result.current.globalIPs).toEqual([]);
  });

  it('fetches data when admin', async () => {
    const { result } = renderHook(() => useIPWhitelist(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(Array.isArray(result.current.globalIPs)).toBe(true);
  });

  it('validates IP format on addGlobalIP', async () => {
    const { result } = renderHook(() => useIPWhitelist(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.addGlobalIP('', 'd', false); });
    expect(ok).toBe(false); // empty

    await act(async () => { ok = await result.current.addGlobalIP('notanip', 'd', false); });
    expect(ok).toBe(false); // invalid

    await act(async () => { ok = await result.current.addGlobalIP('192.168.1.10', 'd', false); });
    expect(ok).toBe(true);

    await act(async () => { ok = await result.current.addGlobalIP('192.168.1.0/24', 'd', true); });
    expect(ok).toBe(true);
  });

  it('handles duplicate error on addGlobalIP', async () => {
    const { result } = renderHook(() => useIPWhitelist(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    mutateResult = { error: { code: '23505' } };
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.addGlobalIP('10.0.0.1', '', false); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('removeGlobalIP success and error', async () => {
    const { result } = renderHook(() => useIPWhitelist(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.removeGlobalIP('1'); });
    expect(toast.success).toHaveBeenCalled();
  });

  it('toggleUserRestriction insert and update branches', async () => {
    const { result } = renderHook(() => useIPWhitelist(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.toggleUserRestriction('newuser', true); });
    await act(async () => { await result.current.toggleUserRestriction('newuser', false); });
    expect(toast.success).toHaveBeenCalled();
  });

  it('fetchUserIPs and addUserIP / removeUserIP', async () => {
    const { result } = renderHook(() => useIPWhitelist(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.fetchUserIPs('u1'); });

    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.addUserIP('', '', 'd', false); });
    expect(ok).toBe(false);
    await act(async () => { ok = await result.current.addUserIP('u1', 'bad', 'd', false); });
    expect(ok).toBe(false);
    await act(async () => { ok = await result.current.addUserIP('u1', '8.8.8.8', 'd', false); });
    expect(ok).toBe(true);
    await act(async () => { await result.current.removeUserIP('ip1', 'u1'); });
  });
});
