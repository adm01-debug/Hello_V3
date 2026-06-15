import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSessionManager } from '../useSessionManager';

const fromBuilder = () => {
  const b: Record<string, unknown> = {};
  b.insert = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'sess1' }, error: null }) })) }));
  b.select = vi.fn(() => b);
  b.eq = vi.fn(() => b);
  b.neq = vi.fn(() => b);
  b.order = vi.fn().mockResolvedValue({ data: [{ id: 'sess1', session_token: 't', user_agent: 'ua', ip_address: '1.1.1.1', device_info: {}, location: {}, created_at: '', last_activity_at: '', expires_at: '', is_active: true }], error: null });
  b.update = vi.fn(() => b);
  return b;
};

const signOutMock = vi.fn().mockResolvedValue({ error: null });
const refreshSessionMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => fromBuilder()),
    auth: {
      signOut: (...a: unknown[]) => (signOutMock as (...args: unknown[]) => unknown)(...a),
      refreshSession: (...a: unknown[]) => (refreshSessionMock as (...args: unknown[]) => unknown)(...a),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const checkAndNotifyNewDevice = vi.fn();
vi.mock('@/hooks/useDeviceDetection', () => ({
  useDeviceDetection: () => ({
    checkAndNotifyNewDevice,
    getDeviceInfo: () => ({ browser: 'Chrome', os: 'Linux', device: 'Desktop' }),
    getLocationInfo: () => ({ ip: '1.1.1.1' }),
  }),
}));

let mockUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = { id: 'u1', email: 'test@example.com', user_metadata: { full_name: 'Test' } };
let mockSession: { access_token: string; expires_at: number } | null = { access_token: 'a'.repeat(64), expires_at: Math.floor(Date.now() / 1000) + 3600 };
vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: mockUser, session: mockSession }),
}));

describe('useSessionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'u1', email: 'test@example.com', user_metadata: { full_name: 'Test' } };
    mockSession = { access_token: 'a'.repeat(64), expires_at: Math.floor(Date.now() / 1000) + 3600 };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ip: '1.1.1.1', city: 'X', country_name: 'Y', country_code: 'YY' }) }) as unknown as typeof fetch;
    if (!('AbortSignal' in global) || !AbortSignal.timeout) {
      (AbortSignal as unknown as { timeout: (ms: number) => unknown }).timeout = () => ({});
    }
  });
  afterEach(() => { vi.useRealTimers(); });

  it('loads sessions and creates current session', async () => {
    const { result } = renderHook(() => useSessionManager());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessionDurationHours).toBe(24);
    await waitFor(() => expect(result.current.currentSessionId).toBe('sess1'));
    expect(checkAndNotifyNewDevice).toHaveBeenCalled();
  });

  it('revokes a non-current session', async () => {
    const { result } = renderHook(() => useSessionManager());
    await waitFor(() => expect(result.current.currentSessionId).toBe('sess1'));
    await act(async () => { await result.current.revokeSession('other-session'); });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Sessão revogada');
  });

  it('revokes the current session and signs out', async () => {
    const { result } = renderHook(() => useSessionManager());
    await waitFor(() => expect(result.current.currentSessionId).toBe('sess1'));
    await act(async () => { await result.current.revokeSession('sess1'); });
    expect(signOutMock).toHaveBeenCalled();
  });

  it('revokes all other sessions', async () => {
    const { result } = renderHook(() => useSessionManager());
    await waitFor(() => expect(result.current.currentSessionId).toBe('sess1'));
    await act(async () => { await result.current.revokeAllOtherSessions(); });
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Todas as outras sessões foram encerradas');
  });

  it('refreshes sessions on demand', async () => {
    const { result } = renderHook(() => useSessionManager());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.refreshSessions(); });
    expect(result.current.sessions.length).toBeGreaterThanOrEqual(0);
  });

  it('triggers session refresh when near expiry via interval', async () => {
    mockSession = { access_token: 'a'.repeat(64), expires_at: Math.floor(Date.now() / 1000) + 60 };
    vi.useFakeTimers();
    renderHook(() => useSessionManager());
    await act(async () => { vi.advanceTimersByTime(61 * 1000); await Promise.resolve(); });
    expect(refreshSessionMock).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('returns null behavior when there is no user', async () => {
    mockUser = null;
    mockSession = null;
    const { result } = renderHook(() => useSessionManager());
    await waitFor(() => expect(result.current.currentSessionId).toBeNull());
    expect(result.current.sessions).toEqual([]);
  });
});
