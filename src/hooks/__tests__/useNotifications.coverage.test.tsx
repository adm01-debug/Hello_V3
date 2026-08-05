import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

interface Res { data: unknown; error: unknown }
const notifications = [
  { id: 'n1', user_id: 'u1', title: 'A', message: 'm', is_read: false, is_archived: false, type: 't', category: 'system', severity: 'info', created_at: '', updated_at: '' },
  { id: 'n2', user_id: 'u1', title: 'B', message: 'm', is_read: true, is_archived: false, type: 't', category: 'call', severity: 'info', created_at: '', updated_at: '' },
];
const defaultPrefs = (): Res => ({ data: { email_enabled: true, push_enabled: true, sound_enabled: true, digest_enabled: false, digest_frequency: 'daily', quiet_hours_enabled: false, quiet_hours_start: null, quiet_hours_end: null, categories: { system: true } }, error: null });
let prefsRow: Res = defaultPrefs();
const upsertFn = vi.fn().mockResolvedValue({ error: null });
let channelCb: ((p: unknown) => void) | null = null;

const channelObj = {
  on: (_e: string, _c: unknown, cb: (p: unknown) => void) => { channelCb = cb; return channelObj; },
  subscribe: () => channelObj,
};

const stableUser = { id: 'u1' };
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: stableUser }) }));
vi.mock('@/integrations/supabase/client', () => {
  type EqPromise = Promise<{ error: null }> & { eq: () => EqPromise };
  const makeEqPromise = (): EqPromise => {
    const p = Promise.resolve({ error: null }) as EqPromise;
    p.eq = () => makeEqPromise();
    return p;
  };
  const n: Record<string, unknown> = {
    select: () => n, eq: () => n, order: () => n,
    limit: () => Promise.resolve({ data: notifications, error: null }),
    update: () => makeEqPromise(), delete: () => makeEqPromise(),
  };
  const p: Record<string, unknown> = {
    select: () => p, eq: () => p,
    maybeSingle: () => Promise.resolve(prefsRow),
    upsert: (...a: unknown[]) => upsertFn(...a),
  };
  return {
    supabase: {
      from: (t: string) => (t === 'notifications' ? n : p),
      channel: () => channelObj,
      removeChannel: () => undefined,
    },
  };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    channelCb = null;
    prefsRow = defaultPrefs();
    (window as unknown as { Audio: unknown }).Audio = function () { return { play: () => Promise.resolve() }; };
  });

  it('loads notifications and unread count', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications.length).toBe(2);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.preferences.email_enabled).toBe(true);
  });

  it('marks single and all as read', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.markAsRead('n1'); });
    await act(async () => { await result.current.markAllAsRead(); });
    expect(result.current.unreadCount).toBe(0);
  });

  it('archives a notification', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.archiveNotification('n1'); });
    expect(result.current.notifications.some(notif => notif.id === 'n1')).toBe(false);
  });

  it('deletes a notification', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deleteNotification('n2'); });
    expect(result.current.notifications.some(notif => notif.id === 'n2')).toBe(false);
  });

  it('updates preferences', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.updatePreferences({ sound_enabled: false }); });
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', sound_enabled: false }),
      expect.anything(),
    );
  });

  it('handles realtime insert event', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof channelCb).toBe('function');
    act(() => {
      channelCb?.({ new: { id: 'n3', title: 'New', message: 'm', is_read: false } });
    });
    await waitFor(() => expect(result.current.notifications.some(notif => notif.id === 'n3')).toBe(true));
  });

  it('refetch works', async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.notifications.length).toBe(2);
  });

  it('uses defaults when prefs null', async () => {
    prefsRow = { data: null, error: null };
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferences.digest_frequency).toBe('daily');
  });
});
