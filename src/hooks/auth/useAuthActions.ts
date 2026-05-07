import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthState } from './useAuthState';
import type { UserProfile } from './useAuthState';
import { withTimeout } from './useAuthSession';

export function useAuthActions(
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>,
  getProfile: (userId: string) => Promise<UserProfile | null>,
  clearSession: () => Promise<void>,
) {
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        8000,
        'Login request timed out',
      );

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { data: { user: null, session: null }, error };
      }

       const profile = data.user ? await getProfile(data.user.id) : null;

      setAuthState({
        user: data.user,
        session: data.session,
        profile,
        loading: false,
        error: null,
      });

      return { data, error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Login failed');
      setAuthState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: { user: null, session: null }, error: authError };
    }
  }, [getProfile, setAuthState]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        }),
        8000,
        'Signup request timed out',
      );

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { data: { user: null, session: null }, error };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { data, error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Signup failed');
      setAuthState(prev => ({ ...prev, error: authError, loading: false }));
      return { data: { user: null, session: null }, error: authError };
    }
  }, [setAuthState]);

  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await clearSession();
      return { error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Logout failed');
      setAuthState(prev => ({ ...prev, error: authError, loading: false }));
      return { error: authError };
    }
  }, [clearSession, setAuthState]);

  return { signIn, signUp, signOut };
}
