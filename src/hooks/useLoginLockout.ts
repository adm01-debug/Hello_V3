
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface LockoutStatus {
  locked: boolean;
  attempts: number;
  remainingAttempts?: number;
  remainingSeconds?: number;
  lockedUntil?: string;
  /** A RPC falhou: não sabemos se a conta está bloqueada. Quem consome deve recusar a tentativa. */
  unknown?: boolean;
}

export function useLoginLockout() {
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // A-019: as RPCs de lockout são SECURITY DEFINER e ficam sem EXECUTE para
  // anon/authenticated. O único caminho é a edge login-attempt, que aplica
  // rate limit por IP (lido do request, não do corpo) e chama as RPCs com
  // service role.
  const invokeLoginAttempt = useCallback(async (
    action: 'check' | 'fail' | 'success',
    email: string,
  ): Promise<{ data: Record<string, unknown> | null; error: Error | null }> => {
    const { data, error } = await supabase.functions.invoke('login-attempt', {
      body: { email: email.toLowerCase(), action },
    });
    return {
      data: (data as Record<string, unknown> | null) ?? null,
      error: error ? (error as Error) : null,
    };
  }, []);

  const checkLockout = useCallback(async (email: string): Promise<LockoutStatus> => {
    setIsChecking(true);
    try {
      const { data, error } = await invokeLoginAttempt('check', email);

      if (error) {
        logger.error('Error checking lockout:', error);
        return { locked: false, attempts: 0, unknown: true };
      }

      const parsed = data as Record<string, unknown> | null;
      const status: LockoutStatus = {
        locked: (parsed?.locked as boolean) || false,
        attempts: (parsed?.attempts as number) || 0,
        remainingSeconds: parsed?.remaining_seconds as number | undefined,
        lockedUntil: parsed?.locked_until as string | undefined,
      };

      setLockoutStatus(status);
      return status;
    } catch (err) {
      logger.error('Error checking lockout:', err);
      return { locked: false, attempts: 0, unknown: true };
    } finally {
      setIsChecking(false);
    }
  }, [invokeLoginAttempt]);

  const recordFailedAttempt = useCallback(async (
    email: string,
    _ipAddress?: string
  ): Promise<LockoutStatus> => {
    try {
      const { data, error } = await invokeLoginAttempt('fail', email);

      if (error) {
        logger.error('Error recording failed attempt:', error);
        return { locked: false, attempts: 0, unknown: true };
      }

      const parsed = data as Record<string, unknown> | null;
      const status: LockoutStatus = {
        locked: (parsed?.locked as boolean) || false,
        attempts: (parsed?.attempts as number) || 0,
        remainingAttempts: parsed?.remaining_attempts as number | undefined,
        remainingSeconds: parsed?.remaining_seconds as number | undefined,
        lockedUntil: parsed?.locked_until as string | undefined,
      };

      setLockoutStatus(status);
      return status;
    } catch (err) {
      logger.error('Error recording failed attempt:', err);
      return { locked: false, attempts: 0, unknown: true };
    }
  }, [invokeLoginAttempt]);

  const recordSuccessfulLogin = useCallback(async (
    email: string,
    _ipAddress?: string
  ): Promise<void> => {
    try {
      const { error } = await invokeLoginAttempt('success', email);
      if (error) {
        logger.error('Error recording successful login:', error);
      }

      setLockoutStatus(null);
    } catch (err) {
      logger.error('Error recording successful login:', err);
    }
  }, [invokeLoginAttempt]);

  const formatRemainingTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} segundos`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }, []);

  return {
    lockoutStatus,
    isChecking,
    checkLockout,
    recordFailedAttempt,
    recordSuccessfulLogin,
    formatRemainingTime,
  };
}
