import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

type AuthChangeCb = (event: string, session: unknown) => void;
let authChangeCb: AuthChangeCb | null = null;
const unsubscribe = vi.fn();
const onAuthStateChange = vi.fn((cb: AuthChangeCb) => {
  authChangeCb = cb;
  return { data: { subscription: { unsubscribe } } };
});

const getSession = vi.fn();
const clearSession = vi.fn().mockResolvedValue(undefined);
const getProfile = vi.fn().mockResolvedValue({ role: 'admin', id: 'u1' });
let stateValue = { user: null as unknown, session: null as unknown, profile: null as unknown, loading: true, error: null };
const setAuthState = vi.fn((v: unknown) => { if (typeof v === 'object' && v) stateValue = { ...stateValue, ...(v as object) }; });

vi.mock('../auth/useAuthState', () => ({
  useAuthState: () => ({ authState: stateValue, setAuthState }),
}));
vi.mock('../auth/useAuthProfile', () => ({
  useAuthProfile: () => ({ getProfile }),
}));
vi.mock('../auth/useAuthSession', () => ({
  useAuthSession: () => ({ clearSession, getSession, isCleaningUp: { current: false }, fetchedRef: { current: false } }),
}));
vi.mock('../auth/useAuthActions', () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { onAuthStateChange: (cb: AuthChangeCb) => onAuthStateChange(cb) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { useAuth } from '../useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCb = null;
    stateValue = { user: null, session: null, profile: null, loading: true, error: null };
  });

  it('calls getSession on mount and exposes API', () => {
    const { result } = renderHook(() => useAuth());
    expect(getSession).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.hasRole).toBe('function');
  });

  it('hasRole false without profile, true with matching role', () => {
    const { result, rerender } = renderHook(() => useAuth());
    expect(result.current.hasRole(['admin'])).toBe(false);
    stateValue = { ...stateValue, profile: { role: 'admin' } };
    rerender();
    expect(result.current.hasRole(['admin'])).toBe(true);
    expect(result.current.hasRole(['agent'])).toBe(false);
  });

  it('handles SIGNED_OUT auth state change', async () => {
    renderHook(() => useAuth());
    await waitFor(() => expect(authChangeCb).not.toBeNull());
    await act(async () => { authChangeCb?.('SIGNED_OUT', null); });
    expect(setAuthState).toHaveBeenCalledWith(expect.objectContaining({ user: null }));
  });

  it('ignores INITIAL_SESSION event', async () => {
    renderHook(() => useAuth());
    await waitFor(() => expect(authChangeCb).not.toBeNull());
    setAuthState.mockClear();
    await act(async () => { authChangeCb?.('INITIAL_SESSION', { user: { id: 'u1' } }); });
    expect(setAuthState).not.toHaveBeenCalled();
  });

  it('handles SIGNED_IN with session and profile', async () => {
    renderHook(() => useAuth());
    await waitFor(() => expect(authChangeCb).not.toBeNull());
    await act(async () => {
      authChangeCb?.('SIGNED_IN', { user: { id: 'u1' } });
      await Promise.resolve();
    });
    await waitFor(() => expect(getProfile).toHaveBeenCalledWith('u1'));
  });

  it('clears session when getProfile throws', async () => {
    getProfile.mockRejectedValueOnce(new Error('fail'));
    renderHook(() => useAuth());
    await waitFor(() => expect(authChangeCb).not.toBeNull());
    await act(async () => {
      authChangeCb?.('TOKEN_REFRESHED', { user: { id: 'u1' } });
      await Promise.resolve();
    });
    await waitFor(() => expect(clearSession).toHaveBeenCalled());
  });

  it('encerra a sessao quando o token do Supabase some em outra aba', async () => {
    stateValue = { ...stateValue, user: { id: 'u1' }, session: { user: { id: 'u1' } }, loading: false };
    const { result, rerender } = renderHook(() => useAuth());
    await waitFor(() => expect(authChangeCb).not.toBeNull());
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'sb-projeto-auth-token', newValue: null }));
    });

    expect(setAuthState).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, session: null, profile: null, loading: false }),
    );
    rerender();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('nao encerra a sessao quando outra aba renova o token', async () => {
    renderHook(() => useAuth());
    await waitFor(() => expect(authChangeCb).not.toBeNull());
    setAuthState.mockClear();

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'sb-projeto-auth-token', newValue: '{"access_token":"novo"}' }),
      );
    });

    expect(setAuthState).not.toHaveBeenCalled();
  });

  it('ignora remocao de chave que nao e de autenticacao', async () => {
    renderHook(() => useAuth());
    await waitFor(() => expect(authChangeCb).not.toBeNull());
    setAuthState.mockClear();

    await act(async () => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'tema', newValue: null }));
    });

    expect(setAuthState).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
