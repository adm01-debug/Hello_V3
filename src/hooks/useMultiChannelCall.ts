import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useCallTimers } from './useCallTimers';
import { useCallTransfer } from './useCallTransfer';
import { useCallSession } from './useCallSession';
import { useBitrix, type BitrixCallData } from './useBitrix';
import { useAuthContext } from '@/contexts/AuthContext';

const log = logger.create('MultiChannelCall');
export type CallChannel = 'webrtc' | 'wavoip' | 'sip';
export type CallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'on-hold' | 'ended' | 'conference' | 'transferring';
export type CallDirection = 'inbound' | 'outbound';
export type TransferType = 'blind' | 'attended';

export interface TransferTarget {
  type: 'agent' | 'external';
  name?: string;
  phoneNumber: string;
}

export interface CallSession {
  id: string;
  channel: CallChannel;
  status: CallStatus;
  direction: CallDirection;
  phoneNumber?: string;
  contactName?: string;
  startedAt?: Date;
  duration: number;
  totalHoldTime: number;
  holdStartedAt?: Date;
  holdCount: number;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  isInConference: boolean;
  conferenceId?: string;
  isTransferring?: boolean;
  transferTarget?: TransferTarget;
  transcripts: Array<{ role: 'user' | 'agent' | 'system'; text: string; timestamp: Date }>;
  dbSessionId?: string;
  /** Etapa 081: CALL_ID do Bitrix, devolvido por telephony.externalcall.register. */
  bitrixCallId?: string;
  agentName?: string;
}

export interface ConferenceCall {
  id: string;
  participantIds: string[];
  startedAt: Date;
  duration: number;
  isActive: boolean;
  isRecording: boolean;
  recordingStartedAt?: Date;
}

export interface ChannelConfig {
  id: CallChannel;
  name: string;
  enabled: boolean;
  configured: boolean;
  icon: string;
  description: string;
}

const MAX_SIMULTANEOUS_CALLS = 3;

/** Checagem de compliance (DNC + horario legal) antes de discar. */
export type PreDialCheck = (
  phone: string,
  regionCode?: string,
) => Promise<{ canDial: boolean; reasons: string[] }>;

export interface InitiateCallOptions {
  /**
   * Chamada recebida: DNC e horario legal governam a discagem, nao o
   * atendimento. Sem isto, um telefone da DNC nao conseguiria nem atender.
   */
  skipComplianceCheck?: boolean;
}

const AVAILABLE_CHANNELS: ChannelConfig[] = [
  { id: 'webrtc', name: 'WebRTC', enabled: false, configured: false, icon: 'Radio', description: 'Chamadas via navegador com IA (requer configuração)' },
  { id: 'wavoip', name: 'Wavoip', enabled: false, configured: false, icon: 'MessageCircle', description: 'Chamadas via WhatsApp (requer configuração)' },
  { id: 'sip', name: 'SIP Genérico', enabled: true, configured: true, icon: 'Headphones', description: 'Servidor SIP próprio (Bitrix)' },
];

/**
 * Etapa 081: o CALL_ID volta do Bitrix como numero (`{ CALL_ID: 123 }`) e, em
 * algumas versoes, dentro de `result`. Sem normalizar, o id se perde e o
 * `telephony.externalcall.finish` nunca casa com o registro.
 */
export function extrairCallIdBitrix(resposta: unknown): string | null {
  if (!resposta || typeof resposta !== 'object') return null;
  const corpo = resposta as Record<string, unknown>;
  const interno = corpo.result;
  const bruto = corpo.CALL_ID
    ?? (interno && typeof interno === 'object' ? (interno as Record<string, unknown>).CALL_ID : undefined);
  if (bruto === null || bruto === undefined || bruto === '') return null;
  return String(bruto);
}

export function useMultiChannelCall(preDialCheck?: PreDialCheck) {
  const [activeChannel, setActiveChannel] = useState<CallChannel>('sip');
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>(AVAILABLE_CHANNELS);
  const [conference, setConference] = useState<ConferenceCall | null>(null);
  const conferenceDurationRef = useRef<number | null>(null);

  const { startSession, endSession, currentSession, addAnalysis: addCallAnalysis, addTranscript: addDbTranscript } = useCallSession();
  const { profile } = useAuthContext();
  const { registerCall, finishCall } = useBitrix();

  const { startDurationTimer, stopDurationTimer, startHoldTimer, stopHoldTimer, stopAllTimers } = useCallTimers(setActiveCalls);
  const { transferCall, completeTransfer, cancelTransfer } = useCallTransfer(
    activeCalls, activeCallId, setActiveCalls, setActiveCallId, setActiveChannel, stopDurationTimer, setCallHistory
  );

  const currentCall = activeCalls.find(c => c.id === activeCallId) || null;

  const initiateCall = useCallback(async (
    channel: CallChannel,
    phoneNumber?: string,
    contactName?: string,
    options?: InitiateCallOptions,
  ): Promise<CallSession | null> => {
    if (activeCalls.length >= MAX_SIMULTANEOUS_CALLS) return null;

    // Barreira de compliance no ponto unico por onde a discagem passa. Antes
    // o bloqueio existia so em PhoneDialer, e /calls discava para numero da
    // DNC e fora do horario legal sem nenhuma checagem.
    if (phoneNumber && !options?.skipComplianceCheck && preDialCheck) {
      try {
        const { canDial, reasons } = await preDialCheck(phoneNumber);
        if (!canDial) {
          log.warn(`Discagem bloqueada por compliance: ${reasons.join(' · ')}`);
          toast.error('Chamada bloqueada por compliance', { description: reasons.join(' · ') });
          return null;
        }
      } catch (error) {
        // Etapa 035: fail-closed. Antes este catch liberava a discagem --
        // bastava a checagem falhar para ligar para qualquer numero.
        log.error('preDialCheck falhou; discagem bloqueada', error);
        toast.error('Chamada bloqueada por compliance', {
          description: 'Não foi possível verificar a lista DNC e o horário legal. Tente novamente.',
        });
        return null;
      }
    }

    const newCall: CallSession = {
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, channel, status: 'connecting', direction: 'outbound',
      phoneNumber, contactName, startedAt: new Date(), duration: 0, totalHoldTime: 0,
      holdCount: 0, isMuted: false, isOnHold: false, isRecording: false, isInConference: false, transcripts: [],
    };
    setActiveCalls(prev => [...prev, newCall]);
    setActiveCallId(newCall.id);
    setActiveChannel(channel);
    return newCall;
  }, [activeCalls.length, preDialCheck]);

  const switchToCall = useCallback((callId: string) => {
    const call = activeCalls.find(c => c.id === callId);
    if (call) { setActiveCallId(callId); setActiveChannel(call.channel); }
  }, [activeCalls]);

  // Etapa 081: a ponte que da nome ao produto ("Bitrix Call Connect"). Ao atender,
  // registra a chamada no CRM do cliente e guarda o CALL_ID em call_sessions.
  // Fire-and-forget de proposito: CRM fora do ar nao pode derrubar a ligacao, e
  // registerCall ja cai na fila crm_sync_queue quando falha (etapas 082-084).
  const registrarChamadaNoBitrix = useCallback(async (
    chamadaLocalId: string,
    dbSessionId: string,
    phoneNumber: string | undefined,
    direction: CallDirection,
  ) => {
    // Sem numero nao ha o que registrar no CRM.
    if (!phoneNumber) return;
    try {
      const dados: BitrixCallData = {
        PHONE_NUMBER: phoneNumber,
        TYPE: direction === 'inbound' ? 2 : 1,
        CRM_CREATE: 1,
        SHOW: 0,
      };
      const resposta = await registerCall(dados);
      const callIdBitrix = extrairCallIdBitrix(resposta);
      if (!callIdBitrix) {
        log.warn('Bitrix nao devolveu CALL_ID ao registrar a chamada', { chamadaLocalId });
        return;
      }
      setActiveCalls(prev => prev.map(c => c.id === chamadaLocalId ? { ...c, bitrixCallId: callIdBitrix } : c));
      const { error } = await supabase.from('call_sessions')
        .update({ bitrix_call_id: callIdBitrix })
        .eq('id', dbSessionId);
      if (error) log.error('Falha ao gravar bitrix_call_id em call_sessions', error);
    } catch (e) {
      log.error('registrarChamadaNoBitrix falhou', e);
    }
  }, [registerCall]);

  const updateCallStatus = useCallback((status: CallStatus, callId?: string) => {
    const targetId = callId || activeCallId;
    if (!targetId) return;

    // E058: grava call_sessions quando a chamada é atendida (transição qualquer → active)
    if (status === 'active') {
      setActiveCalls(prev => {
        const call = prev.find(c => c.id === targetId);
        if (call && call.status !== 'active' && !call.dbSessionId) {
          void (async () => {
            const session = await startSession(
              call.contactName ?? 'Cliente',
              call.phoneNumber ?? '',
              profile?.full_name ?? undefined,
            );
            if (session) {
              setActiveCalls(p => p.map(c => c.id === targetId ? { ...c, dbSessionId: session.id, agentName: profile?.full_name ?? undefined } : c));
              // Etapa 081: registra a chamada no CRM do cliente (nao bloqueia o atendimento)
              void registrarChamadaNoBitrix(targetId, session.id, call.phoneNumber, call.direction);
            } else {
              log.error('startSession returned null — call_sessions não gravado');
            }
          })();
        }
        return prev;
      });
    }

    setActiveCalls(prev => prev.map(call => {
      if (call.id !== targetId) return call;
      if (status === 'active' && call.status !== 'active') startDurationTimer(targetId);
      return { ...call, status };
    }));
  }, [activeCallId, startDurationTimer, startSession, profile, registrarChamadaNoBitrix]);

  const endCall = useCallback((callId?: string) => {
    const targetId = callId || activeCallId;
    if (!targetId) return;
    stopDurationTimer(targetId);
    const ended = activeCalls.find(c => c.id === targetId);
    if (ended) {
      setCallHistory(prev => [{ ...ended, status: 'ended' as CallStatus }, ...prev].slice(0, 50));

      // E059: fecha a chamada no banco — só se a sessão ainda não foi encerrada
      // (currentSession === null indica que ActiveCallBar já chamou endSession com resumo)
      if (ended.dbSessionId && currentSession) {
        const wasAnswered = ended.status === 'active' || ended.status === 'on-hold' ||
          ended.status === 'conference' || ended.status === 'transferring';
        const wasRinging = ended.status === 'ringing';
        const finalStatus = wasAnswered ? 'completed' : wasRinging ? 'missed' : 'abandoned';
        // E059: o desfecho vai para o banco, nao so para o log — a taxa de
        // abandono e o nivel de servico (etapas 103/104) dependem dele.
        void endSession(ended.duration, undefined, finalStatus).catch(err => {
          log.error(`endSession falhou (${finalStatus}):`, err);
        });
        // Etapa 081: fecha a chamada no CRM com duracao e desfecho (200 atendida,
        // 304 nao atendida). Sem CALL_ID nao existe o que fechar -- o registro
        // segue pendente na fila e o log diz por que.
        if (ended.bitrixCallId) {
          void finishCall(ended.bitrixCallId, Math.max(0, Math.round(ended.duration)), finalStatus === 'completed' ? '200' : '304')
            .catch(err => log.error('finishCall falhou', err));
        } else {
          log.warn('Chamada sem bitrixCallId: telephony.externalcall.finish nao enviado', { callId: targetId });
        }
      }
    }
    setActiveCalls(prev => {
      const remaining = prev.filter(c => c.id !== targetId);
      if (remaining.length > 0 && activeCallId === targetId) { setActiveCallId(remaining[0].id); setActiveChannel(remaining[0].channel); }
      else if (remaining.length === 0) setActiveCallId(null);
      return remaining;
    });
  }, [activeCallId, activeCalls, stopDurationTimer, endSession, currentSession, finishCall]);

  const endAllCalls = useCallback(() => {
    stopAllTimers();
    activeCalls.forEach(call => setCallHistory(prev => [{ ...call, status: 'ended' as CallStatus }, ...prev].slice(0, 50)));
    setActiveCalls([]); setActiveCallId(null);
  }, [activeCalls, stopAllTimers]);

  const toggleMute = useCallback((callId?: string) => {
    const id = callId || activeCallId; if (!id) return;
    setActiveCalls(prev => prev.map(c => c.id === id ? { ...c, isMuted: !c.isMuted } : c));
  }, [activeCallId]);

  // Persist hold event to database
  const persistHoldEvent = useCallback(async (_callId: string, callSessionId: string | undefined, agentName: string | undefined, action: 'start' | 'end', durationSeconds?: number) => {
    // E066: sem dbSessionId a chamada ainda não foi gravada — não persiste hold_event órfão
    if (!callSessionId) {
      log.error('persistHoldEvent: callSessionId ausente, hold_event não gravado');
      return;
    }
    try {
      if (action === 'start') {
        const { error: holdError } = await supabase.from('hold_events').insert({ call_session_id: callSessionId, agent_name: agentName || null, started_at: new Date().toISOString() });
        // Sem o hold gravado a duração de espera do relatório perde este trecho.
        if (holdError) log.error('persistHoldEvent: falha ao gravar o hold', holdError);
      } else {
        const { data: ev, error: evError } = await supabase.from('hold_events').select('id').eq('call_session_id', callSessionId).is('ended_at', null).order('started_at', { ascending: false }).limit(1).maybeSingle();
        if (evError) {
          // Sem a leitura do hold aberto ele fica sem ended_at e a duração de espera
          // do relatório vira lixo: registrar em vez de descartar.
          log.error('persistHoldEvent: falha ao localizar o hold aberto', evError);
        } else if (ev) {
          const { error: closeError } = await supabase.from('hold_events').update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds || 0 }).eq('id', ev.id);
          if (closeError) log.error('persistHoldEvent: falha ao fechar o hold', closeError);
        }
      }
    } catch (error) {
      // Rede caindo no meio: o hold pode ficar sem ended_at e o calculo de espera
      // do relatorio tolera isso (ver comentarios acima). Nao interrompe a chamada.
      log.error('Error persisting hold event:', error);
    }
  }, []);

  const toggleHold = useCallback((callId?: string) => {
    const id = callId || activeCallId; if (!id) return;
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== id) return call;
      const newHold = !call.isOnHold;
      if (newHold) {
        startHoldTimer(id);
        persistHoldEvent(id, call.dbSessionId, call.agentName, 'start');
        return { ...call, isOnHold: true, holdStartedAt: new Date(), holdCount: call.holdCount + 1, status: 'on-hold' as CallStatus };
      } else {
        stopHoldTimer(id);
        const dur = call.holdStartedAt ? Math.floor((Date.now() - call.holdStartedAt.getTime()) / 1000) : 0;
        persistHoldEvent(id, call.dbSessionId, call.agentName, 'end', dur);
        return { ...call, isOnHold: false, holdStartedAt: undefined, status: 'active' as CallStatus };
      }
    }));
  }, [activeCallId, startHoldTimer, stopHoldTimer, persistHoldEvent]);

  const setCallDbSession = useCallback((callId: string, dbSessionId: string, agentName?: string) => {
    setActiveCalls(prev => prev.map(c => c.id === callId ? { ...c, dbSessionId, agentName } : c));
  }, []);

  const toggleRecording = useCallback((callId?: string) => {
    const id = callId || activeCallId; if (!id) return;
    setActiveCalls(prev => prev.map(c => c.id === id ? { ...c, isRecording: !c.isRecording } : c));
  }, [activeCallId]);

  const addTranscript = useCallback((role: 'user' | 'agent' | 'system', text: string, callId?: string) => {
    const id = callId || activeCallId; if (!id) return;
    setActiveCalls(prev => prev.map(c => c.id === id ? { ...c, transcripts: [...c.transcripts, { role, text, timestamp: new Date() }] } : c));
  }, [activeCallId]);

  const configureChannel = useCallback((channelId: CallChannel, config: Partial<ChannelConfig>) => {
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, ...config } : ch));
  }, []);

  const getCallById = useCallback((callId: string) => activeCalls.find(c => c.id === callId) || null, [activeCalls]);

  // Conference operations
  const startConference = useCallback((callIds: string[]) => {
    if (callIds.length < 2) return null;
    const conferenceId = `conf-${Date.now()}`;
    const now = new Date();
    setActiveCalls(prev => prev.map(call => callIds.includes(call.id) ? { ...call, isInConference: true, isOnHold: false, isRecording: true, status: 'conference' as CallStatus, conferenceId } : call));
    const nc: ConferenceCall = { id: conferenceId, participantIds: callIds, startedAt: now, duration: 0, isActive: true, isRecording: true, recordingStartedAt: now };
    setConference(nc);
    conferenceDurationRef.current = window.setInterval(() => { setConference(p => p ? { ...p, duration: p.duration + 1 } : null); }, 1000);
    return nc;
  }, []);

  const addToConference = useCallback((callId: string) => {
    if (!conference) return;
    setActiveCalls(prev => prev.map(c => c.id === callId ? { ...c, isInConference: true, isOnHold: false, isRecording: conference.isRecording, status: 'conference' as CallStatus, conferenceId: conference.id } : c));
    setConference(p => p ? { ...p, participantIds: [...p.participantIds, callId] } : null);
  }, [conference]);

  const endConference = useCallback(() => {
    if (!conference) return;
    if (conferenceDurationRef.current) { clearInterval(conferenceDurationRef.current); conferenceDurationRef.current = null; }
    setActiveCalls(prev => prev.map(c => c.conferenceId === conference.id ? { ...c, isInConference: false, isRecording: false, status: 'active' as CallStatus, conferenceId: undefined } : c));
    setConference(null);
  }, [conference]);

  const removeFromConference = useCallback((callId: string) => {
    if (!conference) return;
    setActiveCalls(prev => prev.map(c => c.id === callId ? { ...c, isInConference: false, status: 'active' as CallStatus, conferenceId: undefined } : c));
    const newIds = conference.participantIds.filter(id => id !== callId);
    if (newIds.length < 2) endConference();
    else setConference(p => p ? { ...p, participantIds: newIds } : null);
  }, [conference, endConference]);

  const toggleConferenceRecording = useCallback(() => {
    if (!conference) return;
    const nr = !conference.isRecording;
    setActiveCalls(prev => prev.map(c => c.conferenceId === conference.id ? { ...c, isRecording: nr } : c));
    setConference(p => p ? { ...p, isRecording: nr, recordingStartedAt: nr ? new Date() : undefined } : null);
  }, [conference]);

  const getCallsAvailableForConference = useCallback(() => activeCalls.filter(c => !c.isInConference && (c.status === 'active' || c.status === 'on-hold')), [activeCalls]);

  useEffect(() => {
    return () => { stopAllTimers(); if (conferenceDurationRef.current) clearInterval(conferenceDurationRef.current); };
  }, [stopAllTimers]);

  return {
    activeChannel, currentCall, activeCalls, activeCallId, callHistory, channels, conference,
    isInCall: activeCalls.length > 0, canAddCall: activeCalls.length < MAX_SIMULTANEOUS_CALLS, maxCalls: MAX_SIMULTANEOUS_CALLS,
    setActiveChannel, initiateCall, switchToCall, updateCallStatus, endCall, endAllCalls,
    toggleMute, toggleHold, toggleRecording, addTranscript, configureChannel, getCallById,
    startConference, addToConference, removeFromConference, endConference, getCallsAvailableForConference, toggleConferenceRecording,
    transferCall, completeTransfer, cancelTransfer, setCallDbSession,
    // Passthrough de useCallSession para consumo via CallContext (evita múltiplas instâncias)
    currentSession, endDbSession: endSession, addCallAnalysis, addDbTranscript,
  };
}
