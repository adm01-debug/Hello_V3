import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Memoize session getter para evitar re-renders desnecessários
  const getSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return;
      }

      setAuthState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error'),
        loading: false,
      }));
    }
  }, []);

  // Effect para carregar sessão inicial
  useEffect(() => {
    getSession();
  }, [getSession]);

  // Effect para subscription - COM CLEANUP
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        setAuthState({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
          error: null,
        });
      }
    );

    // CLEANUP para evitar memory leak
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Memoize login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }

      setAuthState({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Login failed');
      setAuthState(prev => ({ ...prev, error: authError, loading: false }));
      throw authError;
    }
  }, []);

  // Memoize signup function
  const signup = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }

      setAuthState({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Signup failed');
      setAuthState(prev => ({ ...prev, error: authError, loading: false }));
      throw authError;
    }
  }, []);

  // Memoize logout function
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        setAuthState(prev => ({ ...prev, error, loading: false }));
        throw error;
      }

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Logout failed');
      setAuthState(prev => ({ ...prev, error: authError, loading: false }));
      throw authError;
    }
  }, []);

  // Memoize return object para evitar re-renders
  return useMemo(
    () => ({
      user: authState.user,
      session: authState.session,
      loading: authState.loading,
      error: authState.error,
      isAuthenticated: !!authState.user,
      login,
      signup,
      logout,
    }),
    [authState, login, signup, logout]
  );
}

export default useAuth;
