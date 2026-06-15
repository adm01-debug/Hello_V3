import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const getSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...a: unknown[]) => getSessionMock(...a),
      signOut: (...a: unknown[]) => signOutMock(...a),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuthSession, withTimeout } from '../useAuthSession';

describe('withTimeout', () => {
  it('resolves when the promise resolves first', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 1000, 'timeout');
    expect(result).toBe('ok');
  });

  it('rejects with message on timeout', async () => {
    vi.useFakeTimers();
    const never = new Promise<string>(() => {});
    const p = withTimeout(never, 100, 'too slow');
    const assertion = expect(p).rejects.toThrow('too slow');
    await vi.advanceTimersByTimeAsync(150);
    await assertion;
    vi.useRealTimers();
  });
});

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    signOutMock.mockResolvedValue({ error: null });
  });

  it('getSession with active session calls getProfile and sets state', async () => {
    const setAuthState = vi.fn();
    const getProfile = vi.fn().mockResolvedValue({ id: 'p1' });
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    const { result } = renderHook(() => useAuthSession(setAuthState, getProfile));
    await act(async () => {
      await result.current.getSession();
    });
    expect(getProfile).toHaveBeenCalledWith('u1');
    expect(setAuthState).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: 'u1' }, profile: { id: 'p1' }, loading: false }),
    );
  });

  it('getSession with no session sets empty state', async () => {
    const setAuthState = vi.fn();
    const getProfile = vi.fn();
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    const { result } = renderHook(() => useAuthSession(setAuthState, getProfile));
    await act(async () => {
      await result.current.getSession();
    });
    expect(getProfile).not.toHaveBeenCalled();
    expect(setAuthState).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, session: null }),
    );
  });

  it('getSession with error clears the session', async () => {
    const setAuthState = vi.fn();
    const getProfile = vi.fn();
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: { message: 'bad token' },
    });
    localStorage.setItem('sb-token', 'x');
    localStorage.setItem('supabase.auth.token', 'y');
    const { result } = renderHook(() => useAuthSession(setAuthState, getProfile));
    await act(async () => {
      await result.current.getSession();
    });
    expect(signOutMock).toHaveBeenCalled();
    expect(localStorage.getItem('sb-token')).toBeNull();
  });

  it('getSession catches thrown errors and clears', async () => {
    const setAuthState = vi.fn();
    const getProfile = vi.fn();
    getSessionMock.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useAuthSession(setAuthState, getProfile));
    await act(async () => {
      await result.current.getSession();
    });
    expect(signOutMock).toHaveBeenCalled();
    expect(setAuthState).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, loading: false }),
    );
  });

  it('clearSession signs out and resets state', async () => {
    const setAuthState = vi.fn();
    const getProfile = vi.fn();
    const { result } = renderHook(() => useAuthSession(setAuthState, getProfile));
    await act(async () => {
      await result.current.clearSession();
    });
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'local' });
    expect(setAuthState).toHaveBeenCalledWith(
      expect.objectContaining({ user: null, session: null, loading: false }),
    );
  });

  it('clearSession swallows signOut failure (fallback cleanup)', async () => {
    const setAuthState = vi.fn();
    const getProfile = vi.fn();
    signOutMock.mockRejectedValue(new Error('corrupted'));
    const { result } = renderHook(() => useAuthSession(setAuthState, getProfile));
    await act(async () => {
      await result.current.clearSession();
    });
    expect(setAuthState).toHaveBeenCalledWith(
      expect.objectContaining({ user: null }),
    );
  });

  it('clearSession short-circuits when already cleaning up', async () => {
    const setAuthState = vi.fn();
    const getProfile = vi.fn();
    signOutMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 50)),
    );
    const { result } = renderHook(() => useAuthSession(setAuthState, getProfile));
    let first: Promise<void>;
    let second: Promise<void>;
    await act(async () => {
      first = result.current.clearSession();
      second = result.current.clearSession();
      await Promise.all([first, second]);
    });
    expect(result.current.isCleaningUp).toBeDefined();
  });
});
