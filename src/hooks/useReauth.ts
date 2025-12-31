import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

type ReauthAction = 
  | 'change_password' 
  | 'change_email' 
  | 'configure_mfa' 
  | 'admin_action'
  | 'delete_account'
  | 'export_data'
  | 'revoke_sessions';

interface ReauthState {
  isRequired: boolean;
  action: ReauthAction | null;
  lastVerified: Date | null;
}

const REAUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export function useReauth() {
  const { user } = useAuthContext();
  const [state, setState] = useState<ReauthState>({
    isRequired: false,
    action: null,
    lastVerified: null,
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const needsReauth = useCallback((action: ReauthAction): boolean => {
    if (!state.lastVerified) return true;
    
    const timeSinceVerification = Date.now() - state.lastVerified.getTime();
    return timeSinceVerification > REAUTH_TIMEOUT_MS;
  }, [state.lastVerified]);

  const requestReauth = useCallback((action: ReauthAction) => {
    if (needsReauth(action)) {
      setState(prev => ({
        ...prev,
        isRequired: true,
        action,
      }));
      return true;
    }
    return false;
  }, [needsReauth]);

  const verifyWithPassword = useCallback(async (password: string): Promise<boolean> => {
    if (!user?.email) return false;

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) return false;

      setState({
        isRequired: false,
        action: null,
        lastVerified: new Date(),
      });
      
      return true;
    } catch {
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [user?.email]);

  const verifyWithMFA = useCallback(async (factorId: string, code: string): Promise<boolean> => {
    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) return false;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) return false;

      setState({
        isRequired: false,
        action: null,
        lastVerified: new Date(),
      });
      
      return true;
    } catch {
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const cancelReauth = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRequired: false,
      action: null,
    }));
  }, []);

  const withReauth = useCallback(<T>(
    action: ReauthAction,
    callback: () => Promise<T>
  ): Promise<T | null> => {
    if (needsReauth(action)) {
      requestReauth(action);
      return Promise.resolve(null);
    }
    return callback();
  }, [needsReauth, requestReauth]);

  return {
    isRequired: state.isRequired,
    action: state.action,
    isVerifying,
    needsReauth,
    requestReauth,
    verifyWithPassword,
    verifyWithMFA,
    cancelReauth,
    withReauth,
    lastVerified: state.lastVerified,
  };
}
