import { useState, useCallback, useRef } from 'react';
import { CallSession, CallStatus, ConferenceCall } from './useMultiChannelCall';
import { logger } from '@/lib/logger';

const log = logger.create('CallConference');

export function useCallConference(
  setActiveCalls: React.Dispatch<React.SetStateAction<CallSession[]>>
) {
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
      id: conferenceId, participantIds: callIds, startedAt: now,
      duration: 0, isActive: true, isRecording: true, recordingStartedAt: now,
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
    if (conferenceDurationRef.current) {
      clearInterval(conferenceDurationRef.current);
      conferenceDurationRef.current = null;
    }
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
      if (call.id === callId) {
        return { ...call, isInConference: false, status: 'active' as CallStatus, conferenceId: undefined };
      }
      return call;
    }));
    const newParticipantIds = conference.participantIds.filter(id => id !== callId);
    if (newParticipantIds.length < 2) {
      endConference();
    } else {
      setConference(prev => prev ? { ...prev, participantIds: newParticipantIds } : null);
    }
  }, [conference, endConference, setActiveCalls]);

  const toggleConferenceRecording = useCallback(() => {
    if (!conference) return;
    const newState = !conference.isRecording;
    setActiveCalls(prev => prev.map(call => {
      if (call.conferenceId === conference.id) return { ...call, isRecording: newState };
      return call;
    }));
    setConference(prev => prev ? { ...prev, isRecording: newState, recordingStartedAt: newState ? new Date() : undefined } : null);
  }, [conference, setActiveCalls]);

  const getCallsAvailableForConference = useCallback((activeCalls: CallSession[]) => {
    return activeCalls.filter(call => !call.isInConference && (call.status === 'active' || call.status === 'on-hold'));
  }, []);

  const cleanupConference = useCallback(() => {
    if (conferenceDurationRef.current) clearInterval(conferenceDurationRef.current);
  }, []);

  return {
    conference, startConference, addToConference, removeFromConference,
    endConference, toggleConferenceRecording, getCallsAvailableForConference, cleanupConference,
  };
}
