import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WavoipStatus = 'disconnected' | 'connecting' | 'connected' | 'calling' | 'active' | 'error';

export interface WavoipCallState {
  status: WavoipStatus;
  callId: string | null;
  phoneNumber: string | null;
  duration: number;
  isConfigured: boolean;
  error: string | null;
}

export function useWavoipCall() {
  const [state, setState] = useState<WavoipCallState>({
    status: 'disconnected',
    callId: null,
    phoneNumber: null,
    duration: 0,
    isConfigured: false,
    error: null
  });

  const durationIntervalRef = useRef<number | null>(null);

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    durationIntervalRef.current = window.setInterval(() => {
      setState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Check if Wavoip is configured
  const checkConfiguration = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('wavoip-call', {
        body: { action: 'connect' }
      });

      if (error) {
        console.error('Wavoip config check error:', error);
        setState(prev => ({ 
          ...prev, 
          isConfigured: false, 
          error: 'Erro ao verificar configuração' 
        }));
        return false;
      }

      const isConfigured = data?.success && data?.connected;
      setState(prev => ({ 
        ...prev, 
        isConfigured, 
        status: isConfigured ? 'connected' : 'disconnected',
        error: isConfigured ? null : 'Token Wavoip não configurado'
      }));
      
      return isConfigured;
    } catch (error) {
      console.error('Wavoip check error:', error);
      setState(prev => ({ 
        ...prev, 
        isConfigured: false, 
        error: 'Falha na conexão' 
      }));
      return false;
    }
  }, []);

  // Start a Wavoip call
  const startCall = useCallback(async (phoneNumber: string): Promise<boolean> => {
    if (!phoneNumber) {
      toast.error('Número de telefone é obrigatório');
      return false;
    }

    setState(prev => ({ 
      ...prev, 
      status: 'connecting', 
      phoneNumber, 
      duration: 0,
      error: null 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('wavoip-call', {
        body: { 
          action: 'start', 
          whatsappId: phoneNumber 
        }
      });

      if (error || !data?.success) {
        const errorMsg = data?.error || 'Falha ao iniciar chamada';
        setState(prev => ({ 
          ...prev, 
          status: 'error', 
          error: errorMsg 
        }));
        toast.error(errorMsg);
        return false;
      }

      setState(prev => ({ 
        ...prev, 
        status: 'calling', 
        callId: data.callId 
      }));

      // Simulate connection after a delay (in production this would be event-driven)
      setTimeout(() => {
        setState(prev => {
          if (prev.status === 'calling') {
            startDurationTimer();
            return { ...prev, status: 'active' };
          }
          return prev;
        });
      }, 2000);

      toast.success('Chamada WhatsApp iniciada');
      return true;
    } catch (error) {
      console.error('Wavoip start call error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: errorMsg 
      }));
      toast.error(errorMsg);
      return false;
    }
  }, [startDurationTimer]);

  // End the current call
  const endCall = useCallback(async (): Promise<boolean> => {
    if (!state.callId) {
      stopDurationTimer();
      setState(prev => ({ 
        ...prev, 
        status: 'connected', 
        callId: null, 
        phoneNumber: null 
      }));
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke('wavoip-call', {
        body: { 
          action: 'end', 
          callId: state.callId 
        }
      });

      stopDurationTimer();

      if (error || !data?.success) {
        console.warn('Wavoip end call warning:', data?.error);
      }

      setState(prev => ({ 
        ...prev, 
        status: 'connected', 
        callId: null, 
        phoneNumber: null,
        duration: 0
      }));

      toast.info('Chamada WhatsApp encerrada');
      return true;
    } catch (error) {
      console.error('Wavoip end call error:', error);
      stopDurationTimer();
      setState(prev => ({ 
        ...prev, 
        status: 'connected', 
        callId: null, 
        phoneNumber: null,
        duration: 0
      }));
      return true; // Still consider it ended
    }
  }, [state.callId, stopDurationTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
    };
  }, [stopDurationTimer]);

  // Check configuration on mount
  useEffect(() => {
    checkConfiguration();
  }, [checkConfiguration]);

  return {
    ...state,
    isInCall: state.status === 'calling' || state.status === 'active',
    checkConfiguration,
    startCall,
    endCall
  };
}
