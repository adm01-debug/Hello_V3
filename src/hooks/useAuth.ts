import { useEffect, useState, useCallback, useMemo } from 'react';
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

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

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

  const getSession = useCallback(async () => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Session check timed out')), 10000)
      );
      
      const sessionPromise = supabase.auth.getSession();
      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>;
      
      if (error) {
        console.warn('Auth session error:', error.message);
        // Clear corrupted session
        await supabase.auth.signOut();
        setAuthState(prev => ({ ...prev, user: null, session: null, profile: null, error: null, loading: false }));
        return;
      }

      if (session?.user) {
        // Validate the session is actually valid by checking the user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.warn('Invalid session detected, clearing...', userError?.message);
          await supabase.auth.signOut();
          setAuthState({ user: null, session: null, profile: null, loading: false, error: null });
          return;
        }
        
        const profile = await getProfile(user.id);
        setAuthState({ user, session, profile, loading: false, error: null });
      } else {
        setAuthState({ user: null, session: null, profile: null, loading: false, error: null });
      }
    } catch (error) {
      console.warn('Auth initialization error:', error);
      // On any error, clear state and let user re-login
      try { await supabase.auth.signOut(); } catch {}
      setAuthState({
        user: null, session: null, profile: null,
        error: null,
        loading: false,
      });
    }
  }, [getProfile]);

  useEffect(() => {
    getSession();
  }, [getSession]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        let profile = null;
        if (session?.user) {
          profile = await getProfile(session.user.id);
        }
        
        setAuthState({
          user: session?.user ?? null,
          session: session ?? null,
          profile,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getProfile]);

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

      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { error };
      }

      setAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
      });
      
      return { error: null };
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Logout failed');
      setAuthState(prev => ({ ...prev, error: authError, loading: false }));
      return { error: authError };
    }
  }, []);

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
