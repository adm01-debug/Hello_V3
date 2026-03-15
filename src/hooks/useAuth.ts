import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'supervisor' | 'agent' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  agent_id: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

// Force-clear all Supabase auth tokens from localStorage
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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Prevent re-entrant session checks and signOut loops
  const isCleaningUp = useRef(false);
  const fetchedRef = useRef(false);

  const getProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

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
        'Sign out timed out'
      );
    } catch {
      // signOut may fail or hang with corrupted session - fallback cleanup below
    } finally {
      clearAuthStorage();

      setAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
      });

      setTimeout(() => {
        isCleaningUp.current = false;
      }, 300);
    }
  }, []);

  const getSession = useCallback(async () => {

    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Session check timed out')), 10000)
      );
      
      const sessionPromise = supabase.auth.getSession();
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>;
      
      if (error) {
        console.warn('Auth session error:', error.message);
        await clearSession();
        return;
      }

      if (session?.user) {
        // Validate the session with the server
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.warn('Invalid session detected, clearing...', userError?.message);
          await clearSession();
          return;
        }
        
        const profile = await getProfile(user.id);
        setAuthState({ user, session, profile, loading: false, error: null });
      } else {
        setAuthState({ user: null, session: null, profile: null, loading: false, error: null });
      }
    } catch (error) {
      console.warn('Auth initialization error:', error);
      await clearSession();
    }
  }, [getProfile, clearSession]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getSession();

    return () => {
      fetchedRef.current = false;
    };
  }, [getSession]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        // If we're cleaning up, ignore all events
        if (isCleaningUp.current) return;

        // On SIGNED_OUT or TOKEN_REFRESHED with null session, clear state
        if (event === 'SIGNED_OUT' || !session) {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
          return;
        }

        // For INITIAL_SESSION, skip - handled by getSession
        if (event === 'INITIAL_SESSION') return;

        // For TOKEN_REFRESHED or SIGNED_IN, validate the token
        if (session?.user) {
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
              console.warn('Auth state change: invalid token, clearing session');
              await clearSession();
              return;
            }
            
            const profile = await getProfile(user.id);
            setAuthState({
              user,
              session,
              profile,
              loading: false,
              error: null,
            });
          } catch {
            await clearSession();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getProfile, clearSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { data: { user: null, session: null }, error };
      }

      const profile = await getProfile(data.user.id);

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
  }, [getProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

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
  }, []);

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
  }, [clearSession]);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!authState.profile) return false;
    return roles.includes(authState.profile.role);
  }, [authState.profile]);

  return useMemo(
    () => ({
      user: authState.user,
      session: authState.session,
      profile: authState.profile,
      loading: authState.loading,
      error: authState.error,
      isAuthenticated: !!authState.user,
      signIn,
      signUp,
      signOut,
      hasRole,
    }),
    [authState, signIn, signUp, signOut, hasRole]
  );
}

export default useAuth;
