import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeHoldAlerts } from '../useRealtimeHoldAlerts';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}));
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

let capturedHandler: ((payload: { new: Record<string, unknown> }) => void) | null = null;

// A chainable, thenable query-builder that survives the suite's mockReset:true
// because its implementation is (re)established in beforeEach.
function makeBuilder(result: { count?: number | null; error: unknown }) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'update', 'eq']) b[m] = vi.fn(() => b);
  (b as { then: unknown }).then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return b;
}

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  capturedHandler = null;

  asMock(supabase.from).mockImplementation(() => makeBuilder({ count: 5, error: null }));
  asMock(supabase.channel).mockImplementation(() => {
    const ch: Record<string, unknown> = {};
    ch.on = vi.fn((_evt: string, _cfg: unknown, handler: (p: { new: Record<string, unknown> }) => void) => {
      capturedHandler = handler;
      return ch;
    });
    ch.subscribe = vi.fn((cb?: (status: string) => void) => {
      cb?.('SUBSCRIBED');
      return ch;
    });
    return ch;
  });

  const NotifMock = vi.fn(function (this: Record<string, unknown>) {
    this.onclick = null;
    this.close = vi.fn();
  }) as unknown as { permission: string; requestPermission: ReturnType<typeof vi.fn> };
  NotifMock.permission = 'granted';
  NotifMock.requestPermission = vi.fn().mockResolvedValue('granted');
  (window as unknown as { Notification: unknown }).Notification = NotifMock;

  (window as unknown as { AudioContext: unknown }).AudioContext = class {
    currentTime = 0;
    destination = {};
    createOscillator() {
      return { connect: vi.fn(), frequency: { value: 0 }, type: '', start: vi.fn(), stop: vi.fn() };
    }
    createGain() {
      return { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
    }
  };
});

describe('useRealtimeHoldAlerts', () => {
  it('initializes and fetches unread count', async () => {
    const { result } = renderHook(() => useRealtimeHoldAlerts());
    await waitFor(() => expect(result.current.unreadCount).toBe(5));
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.browserNotificationsGranted).toBe(true);
  });

  it('toggles notifications on and off', async () => {
    const { result } = renderHook(() => useRealtimeHoldAlerts());
    await waitFor(() => expect(result.current.unreadCount).toBe(5));
    act(() => result.current.toggleNotifications());
    expect(result.current.isEnabled).toBe(false);
    act(() => result.current.toggleNotifications());
    expect(result.current.isEnabled).toBe(true);
  });

  it('requests browser notification permission', async () => {
    const { result } = renderHook(() => useRealtimeHoldAlerts());
    await waitFor(() => expect(result.current.unreadCount).toBe(5));
    await act(async () => { await result.current.requestBrowserNotifications(); });
    expect(result.current.browserNotificationsGranted).toBe(true);
  });

  it('handles a critical realtime alert via channel handler', async () => {
    const { result } = renderHook(() => useRealtimeHoldAlerts());
    await waitFor(() => expect(capturedHandler).not.toBeNull());
    act(() => {
      capturedHandler?.({ new: { id: 'a1', title: 't', message: 'm', severity: 'critical', alert_type: 'hold_time_exceeded', call_session_id: 'c1', created_at: '', is_read: false } });
    });
    await waitFor(() => expect(result.current.recentAlerts.some((a) => a.id === 'a1')).toBe(true));
  });

  it('handles a warning alert and clears unread count', async () => {
    const { result } = renderHook(() => useRealtimeHoldAlerts());
    await waitFor(() => expect(capturedHandler).not.toBeNull());
    act(() => {
      capturedHandler?.({ new: { id: 'a2', title: 't', message: 'm', severity: 'warning', alert_type: 'hold_time_exceeded', call_session_id: 'c2', created_at: '', is_read: false } });
    });
    await waitFor(() => expect(result.current.recentAlerts.some((a) => a.id === 'a2')).toBe(true));
    act(() => result.current.clearUnreadCount());
    expect(result.current.unreadCount).toBe(0);
  });

  it('marks all alerts as read', async () => {
    const { result } = renderHook(() => useRealtimeHoldAlerts());
    await waitFor(() => expect(result.current.unreadCount).toBe(5));
    await act(async () => { await result.current.markAllAsRead(); });
    expect(result.current.unreadCount).toBe(0);
  });
});
