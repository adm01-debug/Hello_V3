import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type MFAMethod = 'totp' | 'phone' | 'both';

interface MFAFactor {
  id: string;
  type: 'totp' | 'phone';
  status: 'verified' | 'unverified';
  friendly_name?: string;
  phone?: string;
}

interface MFASettings {
  mfa_enabled: boolean;
  mfa_method: MFAMethod | null;
  backup_codes: string[];
  last_verified_at: string | null;
  recovery_email: string | null;
}

export function useMFA() {
  const { user } = useAuthContext();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [settings, setSettings] = useState<MFASettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const loadFactors = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const allFactors: MFAFactor[] = [
        ...(data.totp || []).map(f => ({ ...f, type: 'totp' as const })),
        ...(data.phone || []).map(f => ({ ...f, type: 'phone' as const })),
      ];
      
      setFactors(allFactors);
    } catch (error) {
      logger.error('Error loading MFA factors:', error);
    }
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      setSettings(data ? {
        mfa_enabled: data.mfa_enabled || false,
        mfa_method: data.mfa_method as MFAMethod | null,
        backup_codes: data.backup_codes || [],
        last_verified_at: data.last_verified_at,
        recovery_email: data.recovery_email,
      } : null);
    } catch (error) {
      logger.error('Error loading MFA settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFactors();
    loadSettings();
  }, [loadFactors, loadSettings]);

  const enrollTOTP = async (friendlyName?: string) => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName || 'Authenticator App',
      });

      if (error) throw error;

      return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      };
    } catch (error: unknown) {
      toast.error('Erro ao configurar TOTP', { description: (error instanceof Error ? error.message : String(error)) });
      return null;
    } finally {
      setEnrolling(false);
    }
  };

  const enrollPhone = async (phone: string) => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone,
      });

      if (error) throw error;

      return { factorId: data.id };
    } catch (error: unknown) {
      toast.error('Erro ao configurar SMS', { description: (error instanceof Error ? error.message : String(error)) });
      return null;
    } finally {
      setEnrolling(false);
    }
  };

  const verifyFactor = async (factorId: string, code: string) => {
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      await loadFactors();
      return true;
    } catch (error: unknown) {
      toast.error('Código inválido', { description: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  };

  const unenrollFactor = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      
      await loadFactors();
      toast.success('Fator removido com sucesso');
      return true;
    } catch (error: unknown) {
      toast.error('Erro ao remover fator', { description: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  };

  const generateBackupCodes = () => {
    // Unambiguous Crockford-style alphabet: omits O/0, I/1 to avoid transcription errors.
    const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codes = new Set<string>();
    while (codes.size < 10) {
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += ALPHABET[bytes[i] % ALPHABET.length];
      }
      codes.add(code);
    }
    return Array.from(codes);
  };

  const saveSettings = async (newSettings: Partial<MFASettings>) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('user_mfa_settings').upsert({
        user_id: user.id,
        ...newSettings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      await loadSettings();
      return true;
    } catch (error: unknown) {
      toast.error('Erro ao salvar configurações', { description: (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  };

  const hasActiveMFA = factors.some(f => f.status === 'verified');
  const hasTOTP = factors.some(f => f.type === 'totp' && f.status === 'verified');
  const hasPhone = factors.some(f => f.type === 'phone' && f.status === 'verified');

  return {
    factors,
    settings,
    isLoading,
    enrolling,
    hasActiveMFA,
    hasTOTP,
    hasPhone,
    enrollTOTP,
    enrollPhone,
    verifyFactor,
    unenrollFactor,
    generateBackupCodes,
    saveSettings,
    refreshFactors: loadFactors,
  };
}
