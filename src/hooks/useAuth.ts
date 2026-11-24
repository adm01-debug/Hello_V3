import { logger } from '@/lib/logger';
import { useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from './auth/useAuthState';
import { useAuthProfile } from './auth/useAuthProfile';
import { useAuthSession } from './auth/useAuthSession';
import { useAuthActions } from './auth/useAuthActions';

// Chave de sessao do Supabase em localStorage (sb-<ref>-auth-token, com sufixo
// .0/.1 quando o valor e fatiado em pedacos).
const SUPABASE_AUTH_TOKEN_KEY = /^sb-.*-auth-token(\.\d+)?$/;

export type { UserRole, UserProfile } from './auth/useAuthState';

export function useAuth() {
  const { authState, setAuthState } = useAuthState();
  const { getProfile } = useAuthProfile();
  const { clearSession, getSession, isCleaningUp, fetchedRef } = useAuthSession(setAuthState, getProfile);
  const { signIn, signUp, signOut } = useAuthActions(setAuthState, getProfile, clearSession);

  // Initial session fetch
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    getSession();

    return () => {
      fetchedRef.current = false;
    };
  }, [getSession, fetchedRef]);

  const handleSignedOut = useCallback(() => {
    setAuthState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      error: null,
    });
  }, [setAuthState]);

  // Sincroniza o fim de sessao entre abas: o auth-js 2.x nao escuta o evento
  // `storage` (so `visibilitychange`), entao uma aba visivel continuaria
  // autenticada ate a proxima consulta falhar. Reagimos apenas a remocao do
  // token; login ou renovacao em outra aba gravam valor novo e sao ignorados.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || !SUPABASE_AUTH_TOKEN_KEY.test(event.key)) return;
      if (event.newValue !== null) return;
      logger.create('Auth').debug('Sessao encerrada em outra aba');
      handleSignedOut();
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [handleSignedOut]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.create('Auth').debug('Auth state changed:', event);

        if (isCleaningUp.current) return;

        if (event === 'SIGNED_OUT' || !session) {
          handleSignedOut();
          return;
        }

        if (event === 'INITIAL_SESSION') return;

        if (session?.user) {
          void (async () => {
            try {
              const profile = await getProfile(session.user.id);
              setAuthState({
                user: session.user,
                session,
                profile,
                loading: false,
                error: null,
              });
            } catch {
              await clearSession();
            }
          })();
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getProfile, clearSession, setAuthState, isCleaningUp, handleSignedOut]);

  const hasRole = useCallback((roles: import('./auth/useAuthState').UserRole[]) => {
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
    [authState, signIn, signUp, signOut, hasRole],
  );
}

export default useAuth;
