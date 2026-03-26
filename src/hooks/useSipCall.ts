import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JsSIP from 'jssip';
import type { RTCSession } from 'jssip/lib/RTCSession';
import type { UAConfiguration, CallOptions } from 'jssip/lib/UA';

export type SipStatus = 'disconnected' | 'connecting' | 'registered' | 'calling' | 'ringing' | 'active' | 'error';

export interface SipCallState {
  status: SipStatus;
  isRegistered: boolean;
  isConfigured: boolean;
  error: string | null;
  callId: string | null;
  phoneNumber: string | null;
  duration: number;
}

export function useSipCall() {
  const [state, setState] = useState<SipCallState>({
    status: 'disconnected',
    isRegistered: false,
    isConfigured: false,
    error: null,
    callId: null,
    phoneNumber: null,
    duration: 0,
  });

  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<RTCSession | null>(null);
  const durationRef = useRef<number | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for remote audio
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = new Audio();
      audio.autoplay = true;
      document.body.appendChild(audio);
      remoteAudioRef.current = audio;
    }
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
  }, []);

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    stopDurationTimer();
    durationRef.current = window.setInterval(() => {
      setState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, [stopDurationTimer]);

  // Handle incoming remote stream
  const attachRemoteStream = useCallback((session: RTCSession) => {
    const pc = session.connection;
    if (!pc || !remoteAudioRef.current) return;

    pc.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(e => console.warn('Audio play failed:', e));
      }
    };
  }, []);

  // Connect and register to SIP server
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, status: 'connecting', error: null }));

      // Get SIP credentials from edge function
      const { data, error } = await supabase.functions.invoke('sip-config', {
        body: { action: 'connect' }
      });

      if (error || !data?.configured) {
        const errMsg = data?.error || 'Credenciais SIP não configuradas';
        setState(prev => ({ ...prev, status: 'error', isConfigured: false, error: errMsg }));
        return false;
      }

      const { server, username, password } = data;

      // Build WebSocket URL - try wss:// on port 8089 (common for Asterisk/FreePBX/Bitrix)
      const wsServer = `wss://${server}:8089/ws`;

      console.log(`[SIP] Connecting to ${wsServer} as ${username}@${server}`);

      // Configure JsSIP
      const socket = new JsSIP.WebSocketInterface(wsServer);
      const configuration: UAConfiguration = {
        sockets: [socket],
        uri: `sip:${username}@${server}`,
        password: password,
        display_name: username,
        register: true,
        register_expires: 300,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
      };

      // Cleanup previous UA
      if (uaRef.current) {
        try {
          uaRef.current.stop();
        } catch (e) {
          console.warn('[SIP] Error stopping previous UA:', e);
        }
      }

      const ua = new JsSIP.UA(configuration);

      ua.on('connected', () => {
        console.log('[SIP] WebSocket connected');
      });

      ua.on('disconnected', () => {
        console.log('[SIP] WebSocket disconnected');
        setState(prev => ({ ...prev, status: 'disconnected', isRegistered: false }));
      });

      ua.on('registered', () => {
        console.log('[SIP] Registered successfully');
        setState(prev => ({ 
          ...prev, 
          status: 'registered', 
          isRegistered: true, 
          isConfigured: true,
          error: null 
        }));
        toast.success('SIP conectado e registrado');
      });

      ua.on('unregistered', () => {
        console.log('[SIP] Unregistered');
        setState(prev => ({ ...prev, isRegistered: false, status: 'disconnected' }));
      });

      ua.on('registrationFailed', (e: any) => {
        console.error('[SIP] Registration failed:', e?.cause);
        const cause = e?.cause || 'Falha no registro SIP';
        setState(prev => ({ 
          ...prev, 
          status: 'error', 
          isRegistered: false, 
          error: `Registro falhou: ${cause}` 
        }));
        toast.error(`Registro SIP falhou: ${cause}`);
      });

      // Handle incoming calls
      ua.on('newRTCSession', (e: any) => {
        const session = e.session as RTCSession;
        
        if (session.direction === 'incoming') {
          console.log('[SIP] Incoming call from:', session.remote_identity?.uri?.toString());
          // For now, auto-answer incoming calls
          // In production, you'd show a ringing UI
          toast.info(`📞 Chamada recebida de ${session.remote_identity?.display_name || session.remote_identity?.uri?.user || 'Desconhecido'}`);
        }
      });

      ua.start();
      uaRef.current = ua;

      return true;
    } catch (error) {
      console.error('[SIP] Connection error:', error);
      const errMsg = error instanceof Error ? error.message : 'Erro de conexão SIP';
      setState(prev => ({ ...prev, status: 'error', error: errMsg }));
      toast.error(errMsg);
      return false;
    }
  }, []);

  // Make an outbound call
  const startCall = useCallback(async (phoneNumber: string): Promise<boolean> => {
    if (!uaRef.current || !state.isRegistered) {
      // Try to connect first
      const connected = await connect();
      if (!connected) {
        toast.error('Não foi possível conectar ao servidor SIP');
        return false;
      }
      // Wait a bit for registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!uaRef.current) {
        toast.error('Servidor SIP não disponível');
        return false;
      }
    }

    const ua = uaRef.current;
    if (!ua.isRegistered()) {
      toast.error('SIP não registrado. Tente reconectar.');
      return false;
    }

    try {
      // Clean phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      setState(prev => ({ 
        ...prev, 
        status: 'calling', 
        phoneNumber: cleanNumber,
        duration: 0,
        error: null 
      }));

      console.log(`[SIP] Calling ${cleanNumber}`);

      const callOptions: CallOptions = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: {
          iceServers: [
            { urls: ['stun:stun.l.google.com:19302'] }
          ]
        },
        rtcOfferConstraints: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        },
      };

      const sipUri = `sip:${cleanNumber}@${server}`;
      const session = ua.call(sipUri, callOptions);
      sessionRef.current = session;

      session.on('progress', () => {
        console.log('[SIP] Call in progress (ringing)');
        setState(prev => ({ ...prev, status: 'ringing' }));
      });

      session.on('accepted', () => {
        console.log('[SIP] Call accepted');
        setState(prev => ({ ...prev, status: 'active', callId: `sip-${Date.now()}` }));
        startDurationTimer();
        attachRemoteStream(session);
      });

      session.on('confirmed', () => {
        console.log('[SIP] Call confirmed');
        attachRemoteStream(session);
      });

      session.on('ended', (e: any) => {
        console.log('[SIP] Call ended:', e?.cause);
        stopDurationTimer();
        sessionRef.current = null;
        setState(prev => ({ 
          ...prev, 
          status: state.isRegistered ? 'registered' : 'disconnected',
          callId: null,
          phoneNumber: null,
        }));
      });

      session.on('failed', (e: any) => {
        console.error('[SIP] Call failed:', e?.cause);
        stopDurationTimer();
        sessionRef.current = null;
        const cause = e?.cause || 'Chamada falhou';
        setState(prev => ({ 
          ...prev, 
          status: state.isRegistered ? 'registered' : 'disconnected',
          callId: null,
          phoneNumber: null,
          error: cause
        }));
        toast.error(`Chamada falhou: ${cause}`);
      });

      return true;
    } catch (error) {
      console.error('[SIP] Call error:', error);
      const errMsg = error instanceof Error ? error.message : 'Erro ao iniciar chamada';
      setState(prev => ({ ...prev, status: 'error', error: errMsg }));
      toast.error(errMsg);
      return false;
    }
  }, [state.isRegistered, connect, startDurationTimer, stopDurationTimer, attachRemoteStream]);

  // End the current call
  const endCall = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.terminate();
      } catch (e) {
        console.warn('[SIP] Error terminating session:', e);
      }
      sessionRef.current = null;
    }
    stopDurationTimer();
    setState(prev => ({ 
      ...prev, 
      status: prev.isRegistered ? 'registered' : 'disconnected',
      callId: null,
      phoneNumber: null,
      duration: 0,
    }));
  }, [stopDurationTimer]);

  // Toggle mute
  const toggleMute = useCallback((muted: boolean) => {
    if (sessionRef.current) {
      if (muted) {
        sessionRef.current.mute({ audio: true });
      } else {
        sessionRef.current.unmute({ audio: true });
      }
    }
  }, []);

  // Toggle hold
  const toggleHold = useCallback((hold: boolean) => {
    if (sessionRef.current) {
      if (hold) {
        sessionRef.current.hold();
      } else {
        sessionRef.current.unhold();
      }
    }
  }, []);

  // Send DTMF
  const sendDTMF = useCallback((tone: string) => {
    if (sessionRef.current) {
      sessionRef.current.sendDTMF(tone);
    }
  }, []);

  // Disconnect from SIP server
  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.terminate(); } catch (e) { /* ignore */ }
      sessionRef.current = null;
    }
    if (uaRef.current) {
      try { uaRef.current.stop(); } catch (e) { /* ignore */ }
      uaRef.current = null;
    }
    stopDurationTimer();
    setState({
      status: 'disconnected',
      isRegistered: false,
      isConfigured: false,
      error: null,
      callId: null,
      phoneNumber: null,
      duration: 0,
    });
  }, [stopDurationTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    isInCall: state.status === 'calling' || state.status === 'ringing' || state.status === 'active',
    connect,
    disconnect,
    startCall,
    endCall,
    toggleMute,
    toggleHold,
    sendDTMF,
  };
}
