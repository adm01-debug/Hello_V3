import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSecurityDashboard } from '../useSecurityDashboard';

const alertRow = {
  id: 'al1', alert_type: 'login', severity: 'warning', title: 'New login',
  description: 'desc', created_at: '', is_resolved: false,
};

const state = {
  ipEnabled: true as boolean,
  alerts: [alertRow] as unknown[],
  count: 3 as number | null,
  mfaEnabled: true,
  mfaLoading: false,
  sessionsLen: 1,
};

// Referências estáveis para evitar re-render infinito por identidade em useEffect deps
const sessionsCache = new Map<number, ReadonlyArray<{ id: string }>>();
const getSessions = (n: number) => {
  const cached = sessionsCache.get(n);
  if (cached) return cached;
  const arr = Object.freeze(Array.from({ length: n }, (_, i) => ({ id: `s${i}` })));
  sessionsCache.set(n, arr);
  return arr;
};

const mfaCache = new Map<string, unknown>();
const getMfaSettings = (enabled: boolean) => {
  const key = String(enabled);
  const cached = mfaCache.get(key);
  if (cached) return cached;
  const s = Object.freeze({ mfa_enabled: enabled, mfa_method: 'totp', backup_codes: [], last_verified_at: null, recovery_email: null });
  mfaCache.set(key, s);
  return s;
};

vi.mock('@/hooks/useSessionManager', () => ({
  useSessionManager: () => ({
    sessions: getSessions(state.sessionsLen),
    currentSessionId: 's0',
    sessionDurationHours: 24,
  }),
}));

vi.mock('@/hooks/useMFA', () => ({
  useMFA: () => ({
    settings: getMfaSettings(state.mfaEnabled),
    isLoading: state.mfaLoading,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = vi.fn(() => builder);
      builder.order = vi.fn(() => builder);
      builder.limit = vi.fn(() => Promise.resolve({ data: state.alerts, error: null }));
      builder.eq = vi.fn(() => {
        if (table === 'user_ip_restrictions') return builder;
        // blocked_access_logs count query: eq is terminal
        return Promise.resolve({ count: state.count, error: null });
      });
      builder.maybeSingle = vi.fn(() => Promise.resolve({ data: { enabled: state.ipEnabled }, error: null }));
      return builder;
    }),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => {
  const mk = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return { logger: { create: vi.fn(mk), ...mk() } };
});

beforeEach(() => {
  state.ipEnabled = true;
  state.alerts = [alertRow];
  state.count = 3;
  state.mfaEnabled = true;
  state.mfaLoading = false;
  state.sessionsLen = 1;
  vi.clearAllMocks();
});

describe('useSecurityDashboard', () => {
  it('returns early without userId', async () => {
    const { result } = renderHook(() => useSecurityDashboard(undefined));
    // loadSecurityData returns early, isLoading stays true (initial)
    expect(result.current.securityScore.total).toBe(0);
  });

  it('loads data and computes full score', async () => {
    const { result } = renderHook(() => useSecurityDashboard('u1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.ipRestrictionEnabled).toBe(true);
    expect(result.current.recentAlerts.length).toBe(1);
    expect(result.current.blockedAccess).toBe(3);
    // mfa 40 + sessions(1)=20 + ip 25 + recentActivity(1 unresolved)=10
    expect(result.current.securityScore.mfa).toBe(40);
    expect(result.current.securityScore.sessions).toBe(20);
    expect(result.current.securityScore.ipRestriction).toBe(25);
    expect(result.current.securityScore.recentActivity).toBe(10);
    expect(result.current.securityScore.total).toBe(95);
  });

  it('computes lower score branches (no mfa, many sessions, ip off, no alerts)', async () => {
    state.mfaEnabled = false;
    state.ipEnabled = false;
    state.alerts = [];
    state.count = null;
    state.sessionsLen = 6;
    const { result } = renderHook(() => useSecurityDashboard('u1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.securityScore.mfa).toBe(0);
    expect(result.current.securityScore.sessions).toBe(5);
    expect(result.current.securityScore.ipRestriction).toBe(0);
    expect(result.current.securityScore.recentActivity).toBe(15);
    expect(result.current.blockedAccess).toBe(0);
  });

  it('sessions score tier 15 (2-3) and recentActivity 5 (>2 alerts)', async () => {
    state.sessionsLen = 3;
    state.alerts = [
      { ...alertRow, id: 'a', severity: 'critical' },
      { ...alertRow, id: 'b' },
      { ...alertRow, id: 'c' },
    ];
    const { result } = renderHook(() => useSecurityDashboard('u1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.securityScore.sessions).toBe(15);
    expect(result.current.securityScore.recentActivity).toBe(5);
  });

  it('sessions score tier 10 (4-5)', async () => {
    state.sessionsLen = 5;
    const { result } = renderHook(() => useSecurityDashboard('u1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.securityScore.sessions).toBe(10);
  });

  it('manual loadSecurityData call', async () => {
    const { result } = renderHook(() => useSecurityDashboard('u1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.loadSecurityData(); });
    expect(result.current.recentAlerts.length).toBe(1);
  });

  it('exposes session manager and mfa fields', async () => {
    const { result } = renderHook(() => useSecurityDashboard('u1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentSessionId).toBe('s0');
    expect(result.current.sessionDurationHours).toBe(24);
    expect(result.current.mfaSettings?.mfa_enabled).toBe(true);
  });
});
