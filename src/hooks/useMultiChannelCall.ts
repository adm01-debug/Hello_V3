import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useCallTimers } from './useCallTimers';
import { useCallTransfer } from './useCallTransfer';

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

const AVAILABLE_CHANNELS: ChannelConfig[] = [
  { id: 'webrtc', name: 'WebRTC', enabled: true, configured: true, icon: 'Radio', description: 'Chamadas via navegador com IA' },
  { id: 'wavoip', name: 'Wavoip', enabled: false, configured: false, icon: 'MessageCircle', description: 'Chamadas via WhatsApp' },
  { id: 'sip', name: 'SIP Genérico', enabled: true, configured: true, icon: 'Headphones', description: 'Servidor SIP próprio (Bitrix)' },
];

export function useMultiChannelCall() {
  const [activeChannel, setActiveChannel] = useState<CallChannel>('webrtc');
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>(AVAILABLE_CHANNELS);
  const [conference, setConference] = useState<ConferenceCall | null>(null);
  const conferenceDurationRef = useRef<number | null>(null);

  const { startDurationTimer, stopDurationTimer, startHoldTimer, stopHoldTimer, stopAllTimers } = useCallTimers(setActiveCalls);
  const { transferCall, completeTransfer, cancelTransfer } = useCallTransfer(
    activeCalls, activeCallId, setActiveCalls, setActiveCallId, setActiveChannel, stopDurationTimer, setCallHistory
  );

  const currentCall = activeCalls.find(c => c.id === activeCallId) || null;

  const initiateCall = useCallback((channel: CallChannel, phoneNumber?: string, contactName?: string): CallSession | null => {
    if (activeCalls.length >= MAX_SIMULTANEOUS_CALLS) return null;
    const newCall: CallSession = {
      id: `call-${Date.now()}`, channel, status: 'connecting', direction: 'outbound',
      phoneNumber, contactName, startedAt: new Date(), duration: 0, totalHoldTime: 0,
      holdCount: 0, isMuted: false, isOnHold: false, isRecording: false, isInConference: false, transcripts: [],
    };
    setActiveCalls(prev => [...prev, newCall]);
    setActiveCallId(newCall.id);
    setActiveChannel(channel);
    return newCall;
  }, [activeCalls.length]);

  const switchToCall = useCallback((callId: string) => {
    const call = activeCalls.find(c => c.id === callId);
    if (call) { setActiveCallId(callId); setActiveChannel(call.channel); }
  }, [activeCalls]);

  const updateCallStatus = useCallback((status: CallStatus, callId?: string) => {
    const targetId = callId || activeCallId;
    if (!targetId) return;
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== targetId) return call;
      if (status === 'active' && call.status !== 'active') startDurationTimer(targetId);
      return { ...call, status };
    }));
  }, [activeCallId, startDurationTimer]);

  const endCall = useCallback((callId?: string) => {
    const targetId = callId || activeCallId;
    if (!targetId) return;
    stopDurationTimer(targetId);
    const ended = activeCalls.find(c => c.id === targetId);
    if (ended) setCallHistory(prev => [{ ...ended, status: 'ended' }, ...prev].slice(0, 50));
    setActiveCalls(prev => {
      const remaining = prev.filter(c => c.id !== targetId);
      if (remaining.length > 0 && activeCallId === targetId) { setActiveCallId(remaining[0].id); setActiveChannel(remaining[0].channel); }
      else if (remaining.length === 0) setActiveCallId(null);
      return remaining;
    });
  }, [activeCallId, activeCalls, stopDurationTimer]);

  const endAllCalls = useCallback(() => {
    stopAllTimers();
    activeCalls.forEach(call => setCallHistory(prev => [{ ...call, status: 'ended' }, ...prev].slice(0, 50)));
    setActiveCalls([]); setActiveCallId(null);
  }, [activeCalls, stopAllTimers]);

  const toggleMute = useCallback((callId?: string) => {
    const id = callId || activeCallId; if (!id) return;
    setActiveCalls(prev => prev.map(c => c.id === id ? { ...c, isMuted: !c.isMuted } : c));
  }, [activeCallId]);

  // Persist hold event to database
  const persistHoldEvent = useCallback(async (callId: string, callSessionId: string | undefined, agentName: string | undefined, action: 'start' | 'end', durationSeconds?: number) => {
    try {
      if (action === 'start') {
        await supabase.from('hold_events').insert({ call_session_id: callSessionId || null, agent_name: agentName || null, started_at: new Date().toISOString() });
      } else {
        const { data: ev } = await supabase.from('hold_events').select('id').eq('call_session_id', callSessionId ?? '').is('ended_at', null).order('started_at', { ascending: false }).limit(1).maybeSingle();
        if (ev) await supabase.from('hold_events').update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds || 0 }).eq('id', ev.id);
      }
    } catch (error) { log.error('Error persisting hold event:', error); }
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
  };
}
