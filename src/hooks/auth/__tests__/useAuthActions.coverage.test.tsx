import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthActions } from '../useAuthActions';
import type { AuthState, UserProfile } from '../useAuthState';

const signInWithPassword = vi.fn();
const signUp = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) =>
        (signInWithPassword as (...a: unknown[]) => unknown)(...args),
      signUp: (...args: unknown[]) => (signUp as (...a: unknown[]) => unknown)(...args),
    },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

// withTimeout simply races the promise; with these resolved/rejected mocks it returns immediately.

const PROFILE: UserProfile = {
  id: 'u1',
  email: 'a@b.com',
  full_name: 'A',
  role: 'agent',
  agent_id: null,
};

function setup() {
  const setAuthState = vi.fn() as unknown as React.Dispatch<React.SetStateAction<AuthState>>;
  const getProfile = vi.fn().mockResolvedValue(PROFILE) as (
    userId: string,
  ) => Promise<UserProfile | null>;
  const clearSession = vi.fn().mockResolvedValue(undefined) as () => Promise<void>;
  const { result } = renderHook(() => useAuthActions(setAuthState, getProfile, clearSession));
  return { result, setAuthState, getProfile, clearSession };
}

describe('useAuthActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('signIn success returns data and loads profile', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });
    const { result, getProfile, setAuthState } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signIn>>;
    await act(async () => {
      res = await result.current.signIn('a@b.com', 'pw');
    });
    expect(res.error).toBeNull();
    expect(getProfile).toHaveBeenCalledWith('u1');
    expect(setAuthState).toHaveBeenCalled();
  });

  it('signIn returns supabase error branch', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('bad creds'),
    });
    const { result } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signIn>>;
    await act(async () => {
      res = await result.current.signIn('a@b.com', 'pw');
    });
    expect(res.error).toBeTruthy();
    expect(res.data.user).toBeNull();
  });

  it('signIn catch branch when request throws', async () => {
    signInWithPassword.mockRejectedValue(new Error('network'));
    const { result } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signIn>>;
    await act(async () => {
      res = await result.current.signIn('a@b.com', 'pw');
    });
    expect(res.error).toBeInstanceOf(Error);
    expect((res.error as Error).message).toBe('network');
  });

  it('signIn catch branch with non-Error rejection', async () => {
    signInWithPassword.mockRejectedValue('boom');
    const { result } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signIn>>;
    await act(async () => {
      res = await result.current.signIn('a@b.com', 'pw');
    });
    expect((res.error as Error).message).toBe('Login failed');
  });

  it('signUp success', async () => {
    signUp.mockResolvedValue({
      data: { user: { id: 'u2' }, session: null },
      error: null,
    });
    const { result, setAuthState } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signUp>>;
    await act(async () => {
      res = await result.current.signUp('a@b.com', 'pw', 'Full Name');
    });
    expect(res.error).toBeNull();
    expect(setAuthState).toHaveBeenCalled();
  });

  it('signUp error branch', async () => {
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('exists'),
    });
    const { result } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signUp>>;
    await act(async () => {
      res = await result.current.signUp('a@b.com', 'pw');
    });
    expect(res.error).toBeTruthy();
  });

  it('signUp catch branch', async () => {
    signUp.mockRejectedValue('boom');
    const { result } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signUp>>;
    await act(async () => {
      res = await result.current.signUp('a@b.com', 'pw');
    });
    expect((res.error as Error).message).toBe('Signup failed');
  });

  it('signOut success', async () => {
    const { result, clearSession } = setup();
    let res!: Awaited<ReturnType<typeof result.current.signOut>>;
    await act(async () => {
      res = await result.current.signOut();
    });
    expect(res.error).toBeNull();
    expect(clearSession).toHaveBeenCalled();
  });

  it('signOut error branch', async () => {
    const setAuthState = vi.fn() as unknown as React.Dispatch<React.SetStateAction<AuthState>>;
    const getProfile = vi.fn().mockResolvedValue(null) as (
      userId: string,
    ) => Promise<UserProfile | null>;
    const clearSession = vi.fn().mockRejectedValue(new Error('logout fail')) as () => Promise<void>;
    const { result } = renderHook(() => useAuthActions(setAuthState, getProfile, clearSession));
    let res!: Awaited<ReturnType<typeof result.current.signOut>>;
    await act(async () => {
      res = await result.current.signOut();
    });
    expect((res.error as Error).message).toBe('logout fail');
  });
});
