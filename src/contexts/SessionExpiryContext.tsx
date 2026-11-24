/* eslint-disable react-refresh/only-export-components -- provider e hook compartilham o módulo */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { SESSION_EXPIRED_EVENT } from '@/lib/session-expiry';

const log = logger.create('SessionExpiry');

interface SessionExpiryContextValue {
  /** `true` enquanto o usuário não reautentica. Mantém a rota montada para não perder o rascunho. */
  expired: boolean;
  busy: boolean;
  /** Reautentica com e-mail/senha. Devolve a mensagem de erro, ou `null` no sucesso. */
  reauthenticate: (email: string, password: string) => Promise<string | null>;
  /** Desiste de reautenticar: encerra a sessão e libera o redirecionamento para /login. */
  abandon: () => void;
}

// Sem provider (páginas públicas, testes de componentes isolados) nada muda:
// o 401 segue o caminho antigo e não segura a rota.
const SessionExpiryContext = createContext<SessionExpiryContextValue>({
  expired: false,
  busy: false,
  reauthenticate: async () => 'Sessão expirada: entre novamente.',
  abandon: () => {},
});

export function SessionExpiryProvider({ children }: { children: ReactNode }) {
  const { signIn, signOut } = useAuthContext();
  const queryClient = useQueryClient();
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  // Renovação silenciosa: o refresh token ainda vale na maioria dos casos, e aí
  // o usuário não vê diálogo nenhum.
  const refreshSilently = useCallback(async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        log.warn('Renovação automática da sessão falhou', { message: error?.message });
        return;
      }
      setExpired(false);
      void queryClient.invalidateQueries();
    } finally {
      setBusy(false);
    }
  }, [queryClient]);

  useEffect(() => {
    const onExpired = () => {
      setExpired(true);
      void refreshSilently();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [refreshSilently]);

  const reauthenticate = useCallback(
    async (email: string, password: string) => {
      setBusy(true);
      try {
        const { error } = await signIn(email.trim(), password);
        if (error) return error.message || 'Não foi possível entrar';
        setExpired(false);
        void queryClient.invalidateQueries();
        return null;
      } finally {
        setBusy(false);
      }
    },
    [queryClient, signIn],
  );

  const abandon = useCallback(() => {
    setExpired(false);
    void signOut();
  }, [signOut]);

  const value = useMemo(
    () => ({ expired, busy, reauthenticate, abandon }),
    [expired, busy, reauthenticate, abandon],
  );

  return <SessionExpiryContext.Provider value={value}>{children}</SessionExpiryContext.Provider>;
}

export function useSessionExpiry(): SessionExpiryContextValue {
  return useContext(SessionExpiryContext);
}
