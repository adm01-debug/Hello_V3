import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  totalHoldTime: number; // Total time spent on hold in seconds
  holdStartedAt?: Date; // When current hold started
  holdCount: number; // Number of times put on hold
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  isInConference: boolean;
  conferenceId?: string;
  isTransferring?: boolean;
  transferTarget?: TransferTarget;
  transcripts: Array<{ role: 'user' | 'agent' | 'system'; text: string; timestamp: Date }>;
  // Database tracking fields
  dbSessionId?: string; // ID from call_sessions table
  agentName?: string; // Name of the agent handling the call
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
  {
    id: 'webrtc',
    name: 'WebRTC',
    enabled: true,
    configured: true,
    icon: 'Radio',
    description: 'Chamadas via navegador com IA'
  },
  {
    id: 'wavoip',
    name: 'Wavoip',
    enabled: false,
    configured: false,
    icon: 'MessageCircle',
    description: 'Chamadas via WhatsApp'
  },
  {
    id: 'sip',
    name: 'SIP Genérico',
    enabled: false,
    configured: false,
    icon: 'Headphones',
    description: 'Servidor SIP próprio'
  }
];

export function useMultiChannelCall() {
  const [activeChannel, setActiveChannel] = useState<CallChannel>('webrtc');
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>(AVAILABLE_CHANNELS);
  const [conference, setConference] = useState<ConferenceCall | null>(null);
  
  const durationIntervalsRef = useRef<Map<string, number>>(new Map());
  const holdTimeIntervalsRef = useRef<Map<string, number>>(new Map());
  const conferenceDurationRef = useRef<number | null>(null);

  // Get current active call
  const currentCall = activeCalls.find(c => c.id === activeCallId) || null;

  // Start duration timer for a specific call
  const startDurationTimer = useCallback((callId: string) => {
    // Clear existing timer if any
    const existingTimer = durationIntervalsRef.current.get(callId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    const timer = window.setInterval(() => {
      setActiveCalls(prev => prev.map(call => 
        call.id === callId ? { ...call, duration: call.duration + 1 } : call
      ));
    }, 1000);
    
    durationIntervalsRef.current.set(callId, timer);
  }, []);

  // Stop duration timer for a specific call
  const stopDurationTimer = useCallback((callId: string) => {
    const timer = durationIntervalsRef.current.get(callId);
    if (timer) {
      clearInterval(timer);
      durationIntervalsRef.current.delete(callId);
    }
  }, []);

  // Stop all duration timers
  const stopAllTimers = useCallback(() => {
    durationIntervalsRef.current.forEach((timer) => clearInterval(timer));
    durationIntervalsRef.current.clear();
    holdTimeIntervalsRef.current.forEach((timer) => clearInterval(timer));
    holdTimeIntervalsRef.current.clear();
  }, []);

  // Initialize a new call
  const initiateCall = useCallback((
    channel: CallChannel,
    phoneNumber?: string,
    contactName?: string
  ): CallSession | null => {
    // Check if max calls reached
    if (activeCalls.length >= MAX_SIMULTANEOUS_CALLS) {
      return null;
    }

    const newCall: CallSession = {
      id: `call-${Date.now()}`,
      channel,
      status: 'connecting',
      direction: 'outbound',
      phoneNumber,
      contactName,
      startedAt: new Date(),
      duration: 0,
      totalHoldTime: 0,
      holdCount: 0,
      isMuted: false,
      isOnHold: false,
      isRecording: false,
      isInConference: false,
      transcripts: []
    };
    
    setActiveCalls(prev => [...prev, newCall]);
    setActiveCallId(newCall.id);
    setActiveChannel(channel);
    
    return newCall;
  }, [activeCalls.length]);

  // Switch to a different active call
  const switchToCall = useCallback((callId: string) => {
    const call = activeCalls.find(c => c.id === callId);
    if (call) {
      setActiveCallId(callId);
      setActiveChannel(call.channel);
    }
  }, [activeCalls]);

  // Update call status for a specific call
  const updateCallStatus = useCallback((status: CallStatus, callId?: string) => {
    const targetCallId = callId || activeCallId;
    if (!targetCallId) return;

    setActiveCalls(prev => prev.map(call => {
      if (call.id !== targetCallId) return call;
      
      if (status === 'active' && call.status !== 'active') {
        startDurationTimer(targetCallId);
      }
      
      return { ...call, status };
    }));
  }, [activeCallId, startDurationTimer]);

  // End a specific call
  const endCall = useCallback((callId?: string) => {
    const targetCallId = callId || activeCallId;
    if (!targetCallId) return;

    stopDurationTimer(targetCallId);
    
    const endedCall = activeCalls.find(c => c.id === targetCallId);
    if (endedCall) {
      const finalCall: CallSession = {
        ...endedCall,
        status: 'ended'
      };
      setCallHistory(prev => [finalCall, ...prev].slice(0, 50));
    }
    
    setActiveCalls(prev => {
      const remaining = prev.filter(c => c.id !== targetCallId);
      if (remaining.length > 0 && activeCallId === targetCallId) {
        setActiveCallId(remaining[0].id);
        setActiveChannel(remaining[0].channel);
      } else if (remaining.length === 0) {
        setActiveCallId(null);
      }
      return remaining;
    });
  }, [activeCallId, activeCalls, stopDurationTimer]);

  // End all calls
  const endAllCalls = useCallback(() => {
    stopAllTimers();
    
    activeCalls.forEach(call => {
      const finalCall: CallSession = { ...call, status: 'ended' };
      setCallHistory(prev => [finalCall, ...prev].slice(0, 50));
    });
    
    setActiveCalls([]);
    setActiveCallId(null);
  }, [activeCalls, stopAllTimers]);

  // Toggle mute for current call
  const toggleMute = useCallback((callId?: string) => {
    const targetCallId = callId || activeCallId;
    if (!targetCallId) return;

    setActiveCalls(prev => prev.map(call => 
      call.id === targetCallId ? { ...call, isMuted: !call.isMuted } : call
    ));
  }, [activeCallId]);

  // Start hold time timer for a specific call
  const startHoldTimer = useCallback((callId: string) => {
    const existingTimer = holdTimeIntervalsRef.current.get(callId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    const timer = window.setInterval(() => {
      setActiveCalls(prev => prev.map(call => 
        call.id === callId && call.isOnHold 
          ? { ...call, totalHoldTime: call.totalHoldTime + 1 } 
          : call
      ));
    }, 1000);
    
    holdTimeIntervalsRef.current.set(callId, timer);
  }, []);

  // Stop hold time timer for a specific call
  const stopHoldTimer = useCallback((callId: string) => {
    const timer = holdTimeIntervalsRef.current.get(callId);
    if (timer) {
      clearInterval(timer);
      holdTimeIntervalsRef.current.delete(callId);
    }
  }, []);

  // Persist hold event to database
  const persistHoldEvent = useCallback(async (
    callId: string,
    callSessionId: string | undefined,
    agentName: string | undefined,
    action: 'start' | 'end',
    durationSeconds?: number
  ) => {
    try {
      if (action === 'start') {
        // Create a new hold event
        const { error } = await supabase
          .from('hold_events')
          .insert({
            call_session_id: callSessionId || null,
            agent_name: agentName || null,
            started_at: new Date().toISOString(),
          });
        
        if (error) {
          console.error('Error persisting hold start event:', error);
        } else {
          console.log(`[Hold Event] Started for call ${callId}`);
        }
      } else {
        // Update the most recent hold event for this call with end time and duration
        const { data: recentEvent, error: fetchError } = await supabase
          .from('hold_events')
          .select('id')
          .eq('call_session_id', callSessionId)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching hold event:', fetchError);
          return;
        }

        if (recentEvent) {
          const { error: updateError } = await supabase
            .from('hold_events')
            .update({
              ended_at: new Date().toISOString(),
              duration_seconds: durationSeconds || 0,
            })
            .eq('id', recentEvent.id);

          if (updateError) {
            console.error('Error updating hold event:', updateError);
          } else {
            console.log(`[Hold Event] Ended for call ${callId}, duration: ${durationSeconds}s`);
          }
        }
      }
    } catch (error) {
      console.error('Error persisting hold event:', error);
    }
  }, []);

  // Toggle hold for current call with hold time tracking
  const toggleHold = useCallback((callId?: string) => {
    const targetCallId = callId || activeCallId;
    if (!targetCallId) return;

    // Find the call to get its metadata for persistence
    const targetCall = activeCalls.find(c => c.id === targetCallId);

    setActiveCalls(prev => prev.map(call => {
      if (call.id !== targetCallId) return call;
      const newIsOnHold = !call.isOnHold;
      
      if (newIsOnHold) {
        // Starting hold - start timer and persist
        startHoldTimer(targetCallId);
        persistHoldEvent(targetCallId, call.dbSessionId, call.agentName, 'start');
        return { 
          ...call, 
          isOnHold: true,
          holdStartedAt: new Date(),
          holdCount: call.holdCount + 1,
          status: 'on-hold' as CallStatus
        };
      } else {
        // Ending hold - stop timer and persist
        stopHoldTimer(targetCallId);
        // Calculate duration since hold started
        const holdDuration = call.holdStartedAt 
          ? Math.floor((Date.now() - call.holdStartedAt.getTime()) / 1000)
          : 0;
        persistHoldEvent(targetCallId, call.dbSessionId, call.agentName, 'end', holdDuration);
        return { 
          ...call, 
          isOnHold: false,
          holdStartedAt: undefined,
          status: 'active' as CallStatus
        };
      }
    }));
  }, [activeCallId, activeCalls, startHoldTimer, stopHoldTimer, persistHoldEvent]);

  // Set database session ID for a call
  const setCallDbSession = useCallback((callId: string, dbSessionId: string, agentName?: string) => {
    setActiveCalls(prev => prev.map(call => 
      call.id === callId ? { ...call, dbSessionId, agentName } : call
    ));
  }, []);

  // Toggle recording for current call
  const toggleRecording = useCallback((callId?: string) => {
    const targetCallId = callId || activeCallId;
    if (!targetCallId) return;

    setActiveCalls(prev => prev.map(call => 
      call.id === targetCallId ? { ...call, isRecording: !call.isRecording } : call
    ));
  }, [activeCallId]);

  // Add transcript to current call
  const addTranscript = useCallback((role: 'user' | 'agent' | 'system', text: string, callId?: string) => {
    const targetCallId = callId || activeCallId;
    if (!targetCallId) return;

    setActiveCalls(prev => prev.map(call => {
      if (call.id !== targetCallId) return call;
      return {
        ...call,
        transcripts: [
          ...call.transcripts,
          { role, text, timestamp: new Date() }
        ]
      };
    }));
  }, [activeCallId]);

  // Configure channel
  const configureChannel = useCallback((channelId: CallChannel, config: Partial<ChannelConfig>) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, ...config } : ch
    ));
  }, []);

  // Get call by ID
  const getCallById = useCallback((callId: string) => {
    return activeCalls.find(c => c.id === callId) || null;
  }, [activeCalls]);

  // Start conference call - merge multiple calls with automatic recording
  const startConference = useCallback((callIds: string[]) => {
    if (callIds.length < 2) return null;

    const conferenceId = `conf-${Date.now()}`;
    const now = new Date();
    
    // Update all participating calls - enable recording automatically
    setActiveCalls(prev => prev.map(call => {
      if (callIds.includes(call.id)) {
        return {
          ...call,
          isInConference: true,
          isOnHold: false,
          isRecording: true, // Auto-enable recording for conference
          status: 'conference' as CallStatus,
          conferenceId
        };
      }
      return call;
    }));

    const newConference: ConferenceCall = {
      id: conferenceId,
      participantIds: callIds,
      startedAt: now,
      duration: 0,
      isActive: true,
      isRecording: true, // Conference recording enabled by default
      recordingStartedAt: now
    };

    setConference(newConference);

    // Start conference duration timer
    conferenceDurationRef.current = window.setInterval(() => {
      setConference(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
    }, 1000);

    console.log(`[Conference] Started with auto-recording: ${conferenceId}`);
    return newConference;
  }, []);

  // Add call to existing conference - inherit recording state
  const addToConference = useCallback((callId: string) => {
    if (!conference) return;

    setActiveCalls(prev => prev.map(call => {
      if (call.id === callId) {
        return {
          ...call,
          isInConference: true,
          isOnHold: false,
          isRecording: conference.isRecording, // Inherit conference recording state
          status: 'conference' as CallStatus,
          conferenceId: conference.id
        };
      }
      return call;
    }));

    setConference(prev => prev ? {
      ...prev,
      participantIds: [...prev.participantIds, callId]
    } : null);
    
    console.log(`[Conference] Added call ${callId} with recording: ${conference.isRecording}`);
  }, [conference]);

  // Remove call from conference
  const removeFromConference = useCallback((callId: string) => {
    if (!conference) return;

    setActiveCalls(prev => prev.map(call => {
      if (call.id === callId) {
        return {
          ...call,
          isInConference: false,
          status: 'active' as CallStatus,
          conferenceId: undefined
        };
      }
      return call;
    }));

    const newParticipantIds = conference.participantIds.filter(id => id !== callId);
    
    // If only one participant left, end conference
    if (newParticipantIds.length < 2) {
      endConference();
    } else {
      setConference(prev => prev ? {
        ...prev,
        participantIds: newParticipantIds
      } : null);
    }
  }, [conference]);

  // Toggle conference recording
  const toggleConferenceRecording = useCallback(() => {
    if (!conference) return;

    const newRecordingState = !conference.isRecording;
    
    // Update all participating calls
    setActiveCalls(prev => prev.map(call => {
      if (call.conferenceId === conference.id) {
        return {
          ...call,
          isRecording: newRecordingState
        };
      }
      return call;
    }));

    setConference(prev => prev ? {
      ...prev,
      isRecording: newRecordingState,
      recordingStartedAt: newRecordingState ? new Date() : undefined
    } : null);
    
    console.log(`[Conference] Recording ${newRecordingState ? 'started' : 'stopped'}`);
  }, [conference]);

  // End conference call
  const endConference = useCallback(() => {
    if (!conference) return;

    // Stop conference timer
    if (conferenceDurationRef.current) {
      clearInterval(conferenceDurationRef.current);
      conferenceDurationRef.current = null;
    }

    console.log(`[Conference] Ended. Recording was: ${conference.isRecording}`);

    // Update all participating calls back to active, stop recording
    setActiveCalls(prev => prev.map(call => {
      if (call.conferenceId === conference.id) {
        return {
          ...call,
          isInConference: false,
          isRecording: false, // Stop recording when conference ends
          status: 'active' as CallStatus,
          conferenceId: undefined
        };
      }
      return call;
    }));

    setConference(null);
  }, [conference]);

  // Get calls available for conference (not already in conference)
  const getCallsAvailableForConference = useCallback(() => {
    return activeCalls.filter(call => 
      !call.isInConference && 
      (call.status === 'active' || call.status === 'on-hold')
    );
  }, [activeCalls]);

  // Transfer call to agent or external number
  const transferCall = useCallback((
    callId: string, 
    target: TransferTarget, 
    transferType: TransferType
  ) => {
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== callId) return call;
      
      if (transferType === 'blind') {
        // Blind transfer - immediately mark as transferring then end
        return {
          ...call,
          status: 'transferring' as CallStatus,
          isTransferring: true,
          transferTarget: target
        };
      } else {
        // Attended transfer - put on hold and start consultation
        return {
          ...call,
          isOnHold: true,
          status: 'on-hold' as CallStatus,
          isTransferring: true,
          transferTarget: target
        };
      }
    }));

    // For blind transfer, simulate completion after a short delay
    if (transferType === 'blind') {
      setTimeout(() => {
        completeTransfer(callId);
      }, 2000);
    }
  }, []);

  // Complete the transfer
  const completeTransfer = useCallback((callId: string) => {
    const call = activeCalls.find(c => c.id === callId);
    if (!call) return;

    stopDurationTimer(callId);
    
    const transferredCall: CallSession = {
      ...call,
      status: 'ended'
    };
    setCallHistory(prev => [transferredCall, ...prev].slice(0, 50));
    
    setActiveCalls(prev => prev.filter(c => c.id !== callId));
    
    // Switch to another active call if available
    const remaining = activeCalls.filter(c => c.id !== callId);
    if (remaining.length > 0 && activeCallId === callId) {
      setActiveCallId(remaining[0].id);
      setActiveChannel(remaining[0].channel);
    } else if (remaining.length === 0) {
      setActiveCallId(null);
    }
  }, [activeCalls, activeCallId, stopDurationTimer]);

  // Cancel ongoing transfer
  const cancelTransfer = useCallback((callId: string) => {
    setActiveCalls(prev => prev.map(call => {
      if (call.id !== callId) return call;
      return {
        ...call,
        isOnHold: false,
        status: 'active' as CallStatus,
        isTransferring: false,
        transferTarget: undefined
      };
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllTimers();
      if (conferenceDurationRef.current) {
        clearInterval(conferenceDurationRef.current);
      }
    };
  }, [stopAllTimers]);

  return {
    // State
    activeChannel,
    currentCall,
    activeCalls,
    activeCallId,
    callHistory,
    channels,
    conference,
    isInCall: activeCalls.length > 0,
    canAddCall: activeCalls.length < MAX_SIMULTANEOUS_CALLS,
    maxCalls: MAX_SIMULTANEOUS_CALLS,
    
    // Actions
    setActiveChannel,
    initiateCall,
    switchToCall,
    updateCallStatus,
    endCall,
    endAllCalls,
    toggleMute,
    toggleHold,
    toggleRecording,
    addTranscript,
    configureChannel,
    getCallById,
    
    // Conference actions
    startConference,
    addToConference,
    removeFromConference,
    endConference,
    getCallsAvailableForConference,
    toggleConferenceRecording,
    
    // Transfer actions
    transferCall,
    completeTransfer,
    cancelTransfer,
    
    // Database session tracking
    setCallDbSession
  };
}
