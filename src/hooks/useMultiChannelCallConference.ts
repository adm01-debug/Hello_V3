import { useState, useCallback, useRef } from 'react';
import { CallSession, CallStatus, ConferenceCall, TransferTarget, TransferType } from './useMultiChannelCall';
import { logger } from '@/lib/logger';

const log = logger.create('MultiChannelCallConference');

interface UseConferenceProps {
  activeCalls: CallSession[];
  activeCallId: string | null;
  setActiveCalls: React.Dispatch<React.SetStateAction<CallSession[]>>;
  setActiveCallId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveChannel: React.Dispatch<React.SetStateAction<any>>;
  setCallHistory: React.Dispatch<React.SetStateAction<CallSession[]>>;
  stopDurationTimer: (callId: string) => void;
}

export function useMultiChannelCallConference({
  activeCalls, activeCallId, setActiveCalls, setActiveCallId, setActiveChannel, setCallHistory, stopDurationTimer
}: UseConferenceProps) {
  const [conference, setConference] = useState<ConferenceCall | null>(null);
  const conferenceDurationRef = useRef<number | null>(null);

  const startConference = useCallback((callIds: string[]) => {
    if (callIds.length < 2) return null;
    const conferenceId = `conf-${Date.now()}`;
    const now = new Date();
    
    setActiveCalls(prev => prev.map(call => {
      if (callIds.includes(call.id)) {
        return { ...call, isInConference: true, isOnHold: false, isRecording: true, status: 'conference' as CallStatus, conferenceId };
      }
      return call;
    }));

    const newConference: ConferenceCall = {
      id: conferenceId, participantIds: callIds, startedAt: now, duration: 0,
      isActive: true, isRecording: true, recordingStartedAt: now
    };
    setConference(newConference);
    conferenceDurationRef.current = window.setInterval(() => {
      setConference(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
    }, 1000);
    log.info('Conference started with auto-recording', { conferenceId });
    return newConference;
  }, [setActiveCalls]);

  const addToConference = useCallback((callId: string) => {
    if (!conference) return;
    setActiveCalls(prev => prev.map(call => {
      if (call.id === callId) {
        return { ...call, isInConference: true, isOnHold: false, isRecording: conference.isRecording, status: 'conference' as CallStatus, conferenceId: conference.id };
      }
      return call;
    }));
    setConference(prev => prev ? { ...prev, participantIds: [...prev.participantIds, callId] } : null);
  }, [conference, setActiveCalls]);

  const endConference = useCallback(() => {
    if (!conference) return;
    if (conferenceDurationRef.current) { clearInterval(conferenceDurationRef.current); conferenceDurationRef.current = null; }
    setActiveCalls(prev => prev.map(call => {
      if (call.conferenceId === conference.id) {
        return { ...call, isInConference: false, isRecording: false, status: 'active' as CallStatus, conferenceId: undefined };
      }
      return call;
    }));
    setConference(null);
  }, [conference, setActiveCalls]);

  const removeFromConference = useCallback((callId: string) => {
    if (!conference) return;
    setActiveCalls(prev => prev.map(call => {
      if (call.id === callId) return { ...call, isInConference: false, status: 'active' as CallStatus, conferenceId: undefined };
      return call;
    }));
    const newParticipantIds = conference.participantIds.filter(id => id !== callId);
    if (newParticipantIds.length < 2) { endConference(); }
    else { setConference(prev => prev ? { ...prev, participantIds: newParticipantIds } : null); }
  }, [conference, endConference, setActiveCalls]);

  const toggleConferenceRecording = useCallback(() => {
    if (!conference) return;
    const newState = !conference.isRecording;
    setActiveCalls(prev => prev.map(call => call.conferenceId === conference.id ? { ...call, isRecording: newState } : call));
    setConference(prev => prev ? { ...prev, isRecording: newState, recordingStartedAt: newState ? new Date() : undefined } : null);
  }, [conference, setActiveCalls]);

  const getCallsAvailableForConference = useCallback(() => {
    return activeCalls.filter(call => !call.isInConference && (call.status === 'active' || call.status === 'on-hold'));
  }, [activeCalls]);

  const transferCall = useCallback((callId: string, target: TransferTarget, transferType: TransferType) => {
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== callId) return call;
      if (transferType === 'blind') {
        return { ...call, status: 'transferring' as CallStatus, isTransferring: true, transferTarget: target };
      } else {
        return { ...call, isOnHold: true, status: 'on-hold' as CallStatus, isTransferring: true, transferTarget: target };
      }
    }));
    if (transferType === 'blind') {
      setTimeout(() => { completeTransfer(callId); }, 2000);
    }
  }, []);

  const completeTransfer = useCallback((callId: string) => {
    const call = activeCalls.find(c => c.id === callId);
    if (!call) return;
    stopDurationTimer(callId);
    setCallHistory(prev => [{ ...call, status: 'ended' }, ...prev].slice(0, 50));
    setActiveCalls(prev => prev.filter(c => c.id !== callId));
    const remaining = activeCalls.filter(c => c.id !== callId);
    if (remaining.length > 0 && activeCallId === callId) { setActiveCallId(remaining[0].id); setActiveChannel(remaining[0].channel); }
    else if (remaining.length === 0) { setActiveCallId(null); }
  }, [activeCalls, activeCallId, stopDurationTimer, setActiveCalls, setCallHistory, setActiveCallId, setActiveChannel]);

  const cancelTransfer = useCallback((callId: string) => {
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== callId) return call;
      return { ...call, isOnHold: false, status: 'active' as CallStatus, isTransferring: false, transferTarget: undefined };
    }));
  }, [setActiveCalls]);

  const cleanupConference = useCallback(() => {
    if (conferenceDurationRef.current) clearInterval(conferenceDurationRef.current);
  }, []);

  return {
    conference, startConference, addToConference, removeFromConference, endConference,
    toggleConferenceRecording, getCallsAvailableForConference,
    transferCall, completeTransfer, cancelTransfer, cleanupConference,
  };
}
