
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LockoutStatus {
  locked: boolean;
  attempts: number;
  remainingAttempts?: number;
  remainingSeconds?: number;
  lockedUntil?: string;
}

export function useLoginLockout() {
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkLockout = useCallback(async (email: string): Promise<LockoutStatus> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_login_lockout', {
        p_email: email.toLowerCase()
      });

      if (error) {
        console.error('Error checking lockout:', error);
        return { locked: false, attempts: 0 };
      }

      const status: LockoutStatus = {
        locked: (data as any)?.locked || false,
        attempts: (data as any)?.attempts || 0,
        remainingSeconds: (data as any)?.remaining_seconds,
        lockedUntil: (data as any)?.locked_until,
      };

      setLockoutStatus(status);
      return status;
    } catch (err) {
      console.error('Error checking lockout:', err);
      return { locked: false, attempts: 0 };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const recordFailedAttempt = useCallback(async (
    email: string,
    ipAddress?: string
  ): Promise<LockoutStatus> => {
    try {
      const { data, error } = await supabase.rpc('record_failed_login', {
        p_email: email.toLowerCase(),
        p_ip_address: ipAddress ?? undefined,
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Error recording failed attempt:', error);
        return { locked: false, attempts: 0 };
      }

      const status: LockoutStatus = {
        locked: (data as any)?.locked || false,
        attempts: (data as any)?.attempts || 0,
        remainingAttempts: (data as any)?.remaining_attempts,
        remainingSeconds: (data as any)?.remaining_seconds,
        lockedUntil: (data as any)?.locked_until,
      };

      setLockoutStatus(status);
      return status;
    } catch (err) {
      console.error('Error recording failed attempt:', err);
      return { locked: false, attempts: 0 };
    }
  }, []);

  const recordSuccessfulLogin = useCallback(async (
    email: string,
    ipAddress?: string
  ): Promise<void> => {
    try {
      await supabase.rpc('record_successful_login', {
        p_email: email.toLowerCase(),
        p_ip_address: ipAddress ?? undefined,
        p_user_agent: navigator.userAgent
      });

      setLockoutStatus(null);
    } catch (err) {
      console.error('Error recording successful login:', err);
    }
  }, []);

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
