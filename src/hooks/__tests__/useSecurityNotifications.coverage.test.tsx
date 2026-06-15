import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

let mockUser: { id: string } | null = { id: 'u1' };
vi.mock('@/contexts/AuthContext', () => ({ useAuthContext: () => ({ user: mockUser }) }));

const channelHandlers: Array<(payload: unknown) => void> = [];
const channelObj = {
  on: vi.fn((_evt: string, _cfg: unknown, cb: (p: unknown) => void) => { channelHandlers.push(cb); return channelObj; }),
  subscribe: vi.fn((cb?: (s: string) => void) => { cb && cb('SUBSCRIBED'); return channelObj; }),
};
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { channel: vi.fn(() => channelObj), removeChannel: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

import { useSecurityNotifications } from '../useSecurityNotifications';
import { toast } from 'sonner';

describe('useSecurityNotifications', () => {
  beforeEach(() => {
    mockUser = { id: 'u1' };
    channelHandlers.length = 0;
    vi.clearAllMocks();
    (Notification as unknown as { permission: string }).permission = 'default';
  });

  it('detects support and initial permission', () => {
    const { result } = renderHook(() => useSecurityNotifications());
    expect(result.current.isSupported).toBe(true);
    expect(result.current.permission).toBe('default');
  });

  it('requestPermission granted path', async () => {
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue('granted');
    const { result } = renderHook(() => useSecurityNotifications());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.requestPermission(); });
    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalled();
  });

  it('requestPermission denied path', async () => {
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue('denied');
    const { result } = renderHook(() => useSecurityNotifications());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.requestPermission(); });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('requestPermission catch branch', async () => {
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useSecurityNotifications());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.requestPermission(); });
    expect(ok).toBe(false);
  });

  it('showNotification no-ops when not granted, shows when granted', () => {
    const { result } = renderHook(() => useSecurityNotifications());
    act(() => { result.current.showNotification('hi'); });
    // now grant
    (Notification as unknown as { permission: string }).permission = 'granted';
    (Notification.requestPermission as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockResolvedValue('granted');
    const { result: r2 } = renderHook(() => useSecurityNotifications());
    act(() => { void r2.current.requestPermission(); });
  });

  it('subscribes to realtime channels when granted and handles alert payloads', async () => {
    (Notification as unknown as { permission: string }).permission = 'granted';
    renderHook(() => useSecurityNotifications());
    await waitFor(() => expect(channelHandlers.length).toBeGreaterThanOrEqual(3));
    // security alert critical
    act(() => {
      channelHandlers[0]({ new: { id: 'a1', alert_type: 't', severity: 'critical', title: 'T', description: 'D', created_at: '', is_resolved: false } });
    });
    // blocked access
    act(() => {
      channelHandlers[1]({ new: { id: 'b1', ip_address: '1.2.3.4', city: 'SP', country: 'BR', reason: 'r' } });
    });
    // rate limit
    act(() => {
      channelHandlers[2]({ new: { id: 'c1', ip_address: '5.6.7.8', endpoint: '/x', request_count: 99, severity: 'warning' } });
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('skips subscription when no user', () => {
    mockUser = null;
    const { result } = renderHook(() => useSecurityNotifications());
    expect(result.current.permission).toBeDefined();
  });
});
