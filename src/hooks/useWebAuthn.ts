import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  generateChallenge,
  startRegistration,
  startAuthentication,
} from '@/lib/webauthn/webauthn-utils';

interface Passkey {
  id: string;
  credential_id: string;
  friendly_name: string | null;
  device_type: string | null;
  created_at: string;
  last_used_at: string | null;
}

export function useWebAuthn() {
  const { user } = useAuthContext();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      setIsSupported(isWebAuthnSupported());
      setIsPlatformAvailable(await isPlatformAuthenticatorAvailable());
    };
    checkSupport();
  }, []);

  const loadPasskeys = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_passkeys')
        .select('id, credential_id, friendly_name, device_type, created_at, last_used_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPasskeys(data || []);
    } catch (error) {
      console.error('Error loading passkeys:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  const getRpId = (): string => {
    return window.location.hostname;
  };

  const registerPasskey = async (friendlyName?: string): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para registrar uma passkey');
      return false;
    }

    if (!isSupported) {
      toast.error('WebAuthn não é suportado neste navegador');
      return false;
    }

    setIsRegistering(true);

    try {
      const challenge = generateChallenge();
      const rpId = getRpId();

      // Store challenge in database
      const { error: challengeError } = await supabase
        .from('webauthn_challenges')
        .insert({
          user_id: user.id,
          challenge,
          type: 'registration',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        });

      if (challengeError) throw challengeError;

      // Get existing credential IDs to exclude
      const existingCredIds = passkeys.map(p => p.credential_id);

      // Start registration with browser
      const result = await startRegistration({
        challenge,
        userId: user.id,
        userName: user.email || user.id,
        userDisplayName: user.email || 'User',
        rpName: 'CallCenter Pro',
        rpId,
        excludeCredentialIds: existingCredIds,
      });

      // Save credential to database
      const { error: saveError } = await supabase
        .from('user_passkeys')
        .insert({
          user_id: user.id,
          credential_id: result.credentialId,
          public_key: result.publicKey,
          counter: 0,
          device_type: getDeviceType(),
          transports: result.transports,
          friendly_name: friendlyName || getDefaultFriendlyName(),
        });

      if (saveError) throw saveError;

      toast.success('Passkey registrada com sucesso!');
      await loadPasskeys();
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Registro cancelado pelo usuário');
      } else if (error.name === 'InvalidStateError') {
        toast.error('Esta passkey já está registrada');
      } else {
        toast.error('Erro ao registrar passkey', { description: error.message });
      }
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  const authenticateWithPasskey = async (email?: string): Promise<{ success: boolean; userId?: string }> => {
    if (!isSupported) {
      toast.error('WebAuthn não é suportado neste navegador');
      return { success: false };
    }

    setIsAuthenticating(true);

    try {
      const challenge = generateChallenge();
      const rpId = getRpId();

      // Store challenge in database
      const { error: challengeError } = await supabase
        .from('webauthn_challenges')
        .insert({
          challenge,
          type: 'authentication',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });

      if (challengeError) throw challengeError;

      // Get allowed credentials if email provided
      let allowCredentialIds: string[] | undefined;
      
      if (email) {
        // Get user ID from email via user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (profile) {
          const { data: userPasskeys } = await supabase
            .from('user_passkeys')
            .select('credential_id')
            .eq('user_id', profile.id);

          allowCredentialIds = userPasskeys?.map(p => p.credential_id);
        }
      }

      // Start authentication with browser
      const result = await startAuthentication({
        challenge,
        rpId,
        allowCredentialIds,
      });

      // Verify credential exists and get user
      const { data: passkey, error: passkeyError } = await supabase
        .from('user_passkeys')
        .select('user_id, counter')
        .eq('credential_id', result.credentialId)
        .single();

      if (passkeyError || !passkey) {
        throw new Error('Passkey não encontrada');
      }

      // Update last used and counter
      await supabase
        .from('user_passkeys')
        .update({
          last_used_at: new Date().toISOString(),
          counter: (passkey.counter || 0) + 1,
        })
        .eq('credential_id', result.credentialId);

      // Get user email for sign in
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('id', passkey.user_id)
        .single();

      if (!userProfile?.email) {
        throw new Error('Usuário não encontrado');
      }

      // Create a one-time token for passwordless login via edge function
      const { data: authData, error: authError } = await supabase.functions.invoke('webauthn-authenticate', {
        body: {
          credentialId: result.credentialId,
          userId: passkey.user_id,
          email: userProfile.email,
        },
      });

      if (authError || !authData?.success) {
        throw new Error(authError?.message || 'Falha na autenticação');
      }

      toast.success('Login realizado com sucesso!');
      return { success: true, userId: passkey.user_id };
    } catch (error: any) {
      console.error('Authentication error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticação cancelada pelo usuário');
      } else {
        toast.error('Erro na autenticação', { description: error.message });
      }
      return { success: false };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const removePasskey = async (passkeyId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_passkeys')
        .delete()
        .eq('id', passkeyId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Passkey removida com sucesso');
      await loadPasskeys();
      return true;
    } catch (error: any) {
      toast.error('Erro ao remover passkey', { description: error.message });
      return false;
    }
  };

  const renamePasskey = async (passkeyId: string, newName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_passkeys')
        .update({ friendly_name: newName })
        .eq('id', passkeyId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Passkey renomeada');
      await loadPasskeys();
      return true;
    } catch (error: any) {
      toast.error('Erro ao renomear passkey', { description: error.message });
      return false;
    }
  };

  return {
    passkeys,
    isLoading,
    isSupported,
    isPlatformAvailable,
    isRegistering,
    isAuthenticating,
    hasPasskeys: passkeys.length > 0,
    registerPasskey,
    authenticateWithPasskey,
    removePasskey,
    renamePasskey,
    refreshPasskeys: loadPasskeys,
  };
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

function getDefaultFriendlyName(): string {
  const device = getDeviceType();
  const date = new Date().toLocaleDateString('pt-BR');
  return `${device} - ${date}`;
}
