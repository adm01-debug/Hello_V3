import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JsSIP from 'jssip';
import type { RTCSession } from 'jssip/lib/RTCSession';
import type { UAConfiguration, CallOptions } from 'jssip/lib/UA';
import { logger } from '@/lib/logger';
import { useVoipQualityMonitor } from './useVoipQualityMonitor';
import { useQualityTrendAnalyzer } from './useQualityTrendAnalyzer';
import { useVoipAutoRemediation } from './useVoipAutoRemediation';
import { useTrunkUsageReporter } from './useTrunkUsageReporter';

const log = logger.create('SIP');

export type SipStatus = 'disconnected' | 'connecting' | 'registered' | 'calling' | 'ringing' | 'active' | 'error';

export interface IncomingCallInfo {
  /** Número/ramal do chamador (somente dígitos quando disponível). */
  from: string;
  /** Nome de exibição enviado pelo peer, quando existir. */
  displayName: string | null;
  /** Momento (epoch ms) em que o convite chegou — usado para timeout de UI. */
  receivedAt: number;
}

export interface SipCallState {
  status: SipStatus;
  isRegistered: boolean;
  isConfigured: boolean;
  error: string | null;
  callId: string | null;
  phoneNumber: string | null;
  duration: number;
  /** Convite entrante pendente de atendimento (null quando não há). */
  incomingCall: IncomingCallInfo | null;
}


 export interface CallControls {
   isMuted: boolean;
   isOnHold: boolean;
 }
 
 export function useSipCall() {
   const [state, setState] = useState<SipCallState>({
     status: 'disconnected', isRegistered: false, isConfigured: false,
     error: null, callId: null, phoneNumber: null, duration: 0, incomingCall: null,
   });
   const [controls, setControls] = useState<CallControls>({ isMuted: false, isOnHold: false });
  const uaRef = useRef<JsSIP.UA | null>(null);
  const sessionRef = useRef<RTCSession | null>(null);
  const incomingRef = useRef<RTCSession | null>(null);
  const durationRef = useRef<number | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const serverRef = useRef<string>('');
  const [activePc, setActivePc] = useState<RTCPeerConnection | null>(null);
  const usageReporter = useTrunkUsageReporter();

  // Monitora qualidade VoIP em tempo real e persiste em call_quality_metrics ao final da chamada
  const quality = useVoipQualityMonitor(activePc, {
    callSessionId: state.callId,
    agentName: null,
    channel: 'sip',
    persistOnEnd: true,
  });

  // Auto-remediação: sugere reconexão quando degradação é severa (declarado antes do trend)
  const remediation = useVoipAutoRemediation({
    reconnect: async () => {
      try { sessionRef.current?.terminate(); } catch { /* ignore */ }
      try { uaRef.current?.stop(); } catch { /* ignore */ }
      uaRef.current = null;
      sessionRef.current = null;
      setActivePc(null);
      setState(prev => ({ ...prev, status: 'connecting', isRegistered: false }));
    },
    endCall: () => {
      try { sessionRef.current?.terminate(); } catch { /* ignore */ }
      sessionRef.current = null;
    },
  });

  // Análise preditiva: alerta antes de degradação atingir nível "poor"
  useQualityTrendAnalyzer(
    quality.current?.mos ?? null,
    state.status === 'active',
    {
      callSessionId: state.callId,
      jitterMs: quality.current?.jitterMs ?? null,
      rttMs: quality.current?.rttMs ?? null,
      onSevereDegradation: remediation.suggest,
    },
  );

  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = new Audio();
      audio.autoplay = true;
      document.body.appendChild(audio);
      remoteAudioRef.current = audio;
    }
    return () => {
      if (remoteAudioRef.current) { remoteAudioRef.current.pause(); remoteAudioRef.current.remove(); remoteAudioRef.current = null; }
    };
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
  }, []);

  const startDurationTimer = useCallback(() => {
    stopDurationTimer();
    durationRef.current = window.setInterval(() => {
      setState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, [stopDurationTimer]);

  const attachRemoteStream = useCallback((session: RTCSession) => {
    const pc = session.connection;
    if (!pc || !remoteAudioRef.current) return;
    pc.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(e => log.warn('Audio play failed', e));
      }
    };
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, status: 'connecting', error: null }));
      const { data, error } = await supabase.functions.invoke('sip-config', { body: { action: 'connect' } });
      if (error || !data?.configured) {
        const errMsg = data?.error || 'Credenciais SIP não configuradas';
        setState(prev => ({ ...prev, status: 'error', isConfigured: false, error: errMsg }));
        return false;
      }

      // Captura contexto do trunk para métricas e exibe aviso de failover
      usageReporter.startTracking(data);
      if (data.failover) {
        toast.warning('Linha primária offline — usando linha de backup', {
          description: data.failover_reason ?? undefined,
        });
        log.warn('SIP failover ativo', { from: data.original_trunk_id, to: data.trunk_id });
      }

      const { server, username, password } = data;
      serverRef.current = server;
      const wsServer = `wss://${server}:8089/ws`;
      log.info(`Connecting to ${wsServer}`);

      const socket = new JsSIP.WebSocketInterface(wsServer);
      const configuration: UAConfiguration = {
        sockets: [socket], uri: `sip:${username}@${server}`, password,
        display_name: username, register: true, register_expires: 300,
        session_timers: false, connection_recovery_min_interval: 2, connection_recovery_max_interval: 30,
      };

      if (uaRef.current) { try { uaRef.current.stop(); } catch (e) { log.warn('Error stopping previous UA', e); } }

      const ua = new JsSIP.UA(configuration);
      ua.on('connected', () => { log.debug('WebSocket connected'); });
      ua.on('disconnected', () => { log.debug('WebSocket disconnected'); setState(prev => ({ ...prev, status: 'disconnected', isRegistered: false })); });
      ua.on('registered', () => { log.info('Registered successfully'); setState(prev => ({ ...prev, status: 'registered', isRegistered: true, isConfigured: true, error: null })); toast.success('SIP conectado e registrado'); });
      ua.on('unregistered', () => { log.debug('Unregistered'); setState(prev => ({ ...prev, isRegistered: false, status: 'disconnected' })); });
      ua.on('registrationFailed', (e: { cause?: string }) => {
        log.error('Registration failed', { cause: e?.cause });
        const cause = e?.cause || 'Falha no registro SIP';
        setState(prev => ({ ...prev, status: 'error', isRegistered: false, error: `Registro falhou: ${cause}` }));
        toast.error(`Registro SIP falhou: ${cause}`);
      });
       ua.on('newRTCSession', (e: { session: RTCSession }) => {
         const session = e.session as RTCSession;
         
         session.on('peerconnection', (e: { peerconnection: RTCPeerConnection }) => {
           setActivePc(e.peerconnection);
         });
 
         session.on('peerconnection', (e: { peerconnection: RTCPeerConnection }) => {
           setActivePc(e.peerconnection);
           
           // Monitoramento via track para sincronizar mute de outros dispositivos/trunk
           e.peerconnection.getSenders().forEach(sender => {
             if (sender.track) {
               sender.track.onmute = () => {
                 log.info('Track Mute detected');
                 setControls(prev => ({ ...prev, isMuted: true }));
               };
               sender.track.onunmute = () => {
                 log.info('Track Unmute detected');
                 setControls(prev => ({ ...prev, isMuted: false }));
               };
             }
           });
         });
         session.on('hold', () => {
           log.info('SIP Hold detected');
           setControls(prev => ({ ...prev, isOnHold: true }));
           toast.warning('Chamada em espera');
         });
         session.on('unhold', () => {
           log.info('SIP Unhold detected');
           setControls(prev => ({ ...prev, isOnHold: false }));
           toast.success('Chamada retomada');
         });
 
         if (session.direction === 'incoming') {
           const from = session.remote_identity?.uri?.user ?? '';
           const displayName = session.remote_identity?.display_name ?? null;
           log.info('Incoming call', { from });

           // Se já existe chamada ativa, rejeita com 486 (Busy Here) para não derrubar a atual.
           if (sessionRef.current) {
             try { session.terminate({ status_code: 486, reason_phrase: 'Busy Here' }); } catch { /* ignore */ }
             log.warn('Incoming call rejected: line busy', { from });
             return;
           }

           incomingRef.current = session;
           setState(prev => ({ ...prev, incomingCall: { from, displayName, receivedAt: Date.now() } }));
           toast.info(`📞 Chamada recebida de ${displayName || from || 'Desconhecido'}`);

           // Chamador desistiu / rede caiu antes do atendimento
           const clearIncoming = () => {
             if (incomingRef.current === session) {
               incomingRef.current = null;
               setState(prev => (prev.incomingCall ? { ...prev, incomingCall: null } : prev));
             }
           };
           session.on('failed', clearIncoming);
           session.on('ended', clearIncoming);
         }

       });

      ua.start();
      uaRef.current = ua;
      return true;
    } catch (error) {
      log.error('Connection error', error);
      const errMsg = error instanceof Error ? error.message : 'Erro de conexão SIP';
      setState(prev => ({ ...prev, status: 'error', error: errMsg }));
      toast.error(errMsg);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = useCallback(async (phoneNumber: string): Promise<boolean> => {
    if (!uaRef.current || !state.isRegistered) {
      const connected = await connect();
      if (!connected) { toast.error('Não foi possível conectar ao servidor SIP'); return false; }
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!uaRef.current) { toast.error('Servidor SIP não disponível'); return false; }
    }
    const ua = uaRef.current;
    if (!ua.isRegistered()) { toast.error('SIP não registrado. Tente reconectar.'); return false; }

    try {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      setState(prev => ({ ...prev, status: 'calling', phoneNumber: cleanNumber, duration: 0, error: null }));
      log.info(`Calling ${cleanNumber}`);

      const callOptions: CallOptions = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] },
        rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
      };

      const sipUri = `sip:${cleanNumber}@${serverRef.current}`;
      const session = ua.call(sipUri, callOptions);
      sessionRef.current = session;

      session.on('progress', () => { log.debug('Call in progress (ringing)'); setState(prev => ({ ...prev, status: 'ringing' })); });
      session.on('accepted', () => {
        log.debug('Call accepted');
        setState(prev => ({ ...prev, status: 'active', callId: `sip-${Date.now()}` }));
        startDurationTimer();
        attachRemoteStream(session);
        if (session.connection) setActivePc(session.connection);
      });
      session.on('confirmed', () => { log.debug('Call confirmed'); attachRemoteStream(session); if (session.connection) setActivePc(session.connection); });
      session.on('ended', (e: { cause?: string }) => { log.debug('Call ended', { cause: e?.cause }); stopDurationTimer(); void usageReporter.endTracking(state.callId); sessionRef.current = null; setActivePc(null); setState(prev => ({ ...prev, status: state.isRegistered ? 'registered' : 'disconnected', callId: null, phoneNumber: null })); });
      session.on('failed', (e: { cause?: string }) => {
        log.error('Call failed', { cause: e?.cause });
        stopDurationTimer(); void usageReporter.endTracking(state.callId); sessionRef.current = null; setActivePc(null);
        const cause = e?.cause || 'Chamada falhou';
        setState(prev => ({ ...prev, status: state.isRegistered ? 'registered' : 'disconnected', callId: null, phoneNumber: null, error: cause }));
        toast.error(`Chamada falhou: ${cause}`);
      });
      return true;
    } catch (error) {
      log.error('Call error', error);
      const errMsg = error instanceof Error ? error.message : 'Erro ao iniciar chamada';
      setState(prev => ({ ...prev, status: 'error', error: errMsg }));
      toast.error(errMsg);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isRegistered, connect, startDurationTimer, stopDurationTimer, attachRemoteStream]);

  /** Atende o convite entrante pendente. Retorna false quando não há convite válido. */
  const answerCall = useCallback(async (): Promise<boolean> => {
    const session = incomingRef.current;
    if (!session) { toast.error('Nenhuma chamada recebida pendente'); return false; }
    if (sessionRef.current) { toast.error('Já existe uma chamada em andamento'); return false; }

    try {
      const from = session.remote_identity?.uri?.user ?? '';
      session.answer({
        mediaConstraints: { audio: true, video: false },
        pcConfig: { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] },
      });
      sessionRef.current = session;
      incomingRef.current = null;
      setState(prev => ({
        ...prev,
        status: 'active',
        incomingCall: null,
        phoneNumber: from,
        duration: 0,
        callId: `sip-in-${Date.now()}`,
        error: null,
      }));

      session.on('confirmed', () => { attachRemoteStream(session); if (session.connection) setActivePc(session.connection); });
      const finish = (cause?: string) => {
        stopDurationTimer();
        sessionRef.current = null;
        setActivePc(null);
        setState(prev => ({
          ...prev,
          status: prev.isRegistered ? 'registered' : 'disconnected',
          callId: null, phoneNumber: null, duration: 0,
          error: cause ?? null,
        }));
      };
      session.on('ended', () => finish());
      session.on('failed', (e: { cause?: string }) => { finish(e?.cause); if (e?.cause) toast.error(`Chamada encerrada: ${e.cause}`); });

      attachRemoteStream(session);
      if (session.connection) setActivePc(session.connection);
      startDurationTimer();
      return true;
    } catch (error) {
      log.error('Answer error', error);
      incomingRef.current = null;
      setState(prev => ({ ...prev, incomingCall: null, error: 'Falha ao atender chamada' }));
      toast.error('Falha ao atender a chamada');
      return false;
    }
  }, [attachRemoteStream, startDurationTimer, stopDurationTimer]);

  /** Rejeita o convite entrante pendente com 603 Decline. */
  const rejectCall = useCallback(() => {
    const session = incomingRef.current;
    incomingRef.current = null;
    setState(prev => ({ ...prev, incomingCall: null }));
    if (!session) return;
    try { session.terminate({ status_code: 603, reason_phrase: 'Decline' }); } catch (e) { log.warn('Error rejecting call', e); }
  }, []);

  const endCall = useCallback(() => {
    if (incomingRef.current) {
      try { incomingRef.current.terminate({ status_code: 603, reason_phrase: 'Decline' }); } catch { /* ignore */ }
      incomingRef.current = null;
    }
    if (sessionRef.current) { try { sessionRef.current.terminate(); } catch (e) { log.warn('Error terminating session', e); } sessionRef.current = null; }
    stopDurationTimer();
    setState(prev => ({ ...prev, status: prev.isRegistered ? 'registered' : 'disconnected', callId: null, phoneNumber: null, duration: 0, incomingCall: null }));
  }, [stopDurationTimer]);


   const toggleMute = useCallback((muted: boolean) => {
     if (sessionRef.current) {
       if (muted) sessionRef.current.mute({ audio: true });
       else sessionRef.current.unmute({ audio: true });
       setControls(prev => ({ ...prev, isMuted: muted }));
     }
   }, []);
 
   const toggleHold = useCallback((hold: boolean) => {
     if (sessionRef.current) {
       if (hold) sessionRef.current.hold();
       else sessionRef.current.unhold();
       setControls(prev => ({ ...prev, isOnHold: hold }));
     }
   }, []);

  const sendDTMF = useCallback((tone: string) => { if (sessionRef.current) sessionRef.current.sendDTMF(tone); }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) { try { sessionRef.current.terminate(); } catch { /* ignore */ } sessionRef.current = null; }
    if (uaRef.current) { try { uaRef.current.stop(); } catch { /* ignore */ } uaRef.current = null; }
    stopDurationTimer();
    setState({ status: 'disconnected', isRegistered: false, isConfigured: false, error: null, callId: null, phoneNumber: null, duration: 0, incomingCall: null });
  }, [stopDurationTimer]);

  useEffect(() => { return () => { disconnect(); }; }, [disconnect]);

   return {
     ...state,
     ...controls,
     isInCall: state.status === 'calling' || state.status === 'ringing' || state.status === 'active',
     hasIncomingCall: state.incomingCall !== null,
      quality,
      pc: activePc,
      connect, disconnect, startCall, endCall, answerCall, rejectCall, toggleMute, toggleHold, sendDTMF,
   };
}
