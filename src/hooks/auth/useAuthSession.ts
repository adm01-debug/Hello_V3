import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthState } from './useAuthState';
import { logger } from '@/lib/logger';

/** Force-clear all Supabase auth tokens from localStorage */
function clearAuthStorage() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // localStorage may be unavailable
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

const EMPTY_STATE: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: false,
  error: null,
};

export function useAuthSession(
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>,
  getProfile: (userId: string) => Promise<import('./useAuthState').UserProfile | null>,
) {
  const isCleaningUp = useRef(false);
  const fetchedRef = useRef(false);

  const clearSession = useCallback(async () => {
    if (isCleaningUp.current) {
      setAuthState(prev => (prev.loading ? { ...prev, loading: false } : prev));
      return;
    }

    isCleaningUp.current = true;

    try {
      await withTimeout(
        supabase.auth.signOut({ scope: 'local' }),
        1500,
        'Sign out timed out',
      );
    } catch {
      // signOut may fail with corrupted session - fallback cleanup below
    } finally {
      clearAuthStorage();
      setAuthState(EMPTY_STATE);
      setTimeout(() => {
        isCleaningUp.current = false;
      }, 300);
    }
  }, [setAuthState]);

  const getSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        4000,
        'Session check timed out',
      );

      if (error) {
        logger.warn('Auth session error:', error.message);
        await clearSession();
        return;
      }

      if (session?.user) {
         const profile = session.user ? await getProfile(session.user.id) : null;
        setAuthState({ user: session.user, session, profile, loading: false, error: null });
      } else {
        setAuthState(EMPTY_STATE);
      }
    } catch (error) {
      logger.warn('Auth initialization error:', error);
      await clearSession();
    }
  }, [getProfile, clearSession, setAuthState]);

  return { clearSession, getSession, isCleaningUp, fetchedRef };
}
