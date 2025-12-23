import { useState, useCallback, useRef, useEffect } from 'react';

export type CallChannel = 'webrtc' | 'wavoip' | 'sip';
export type CallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'on-hold' | 'ended';
export type CallDirection = 'inbound' | 'outbound';

export interface CallSession {
  id: string;
  channel: CallChannel;
  status: CallStatus;
  direction: CallDirection;
  phoneNumber?: string;
  contactName?: string;
  startedAt?: Date;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  transcripts: Array<{ role: 'user' | 'agent' | 'system'; text: string; timestamp: Date }>;
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
  
  const durationIntervalsRef = useRef<Map<string, number>>(new Map());

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
      isMuted: false,
      isOnHold: false,
      isRecording: false,
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
    
    setActiveCalls(prev => prev.filter(c => c.id !== targetCallId));
    
    // Switch to another active call if available
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

  // Toggle hold for current call
  const toggleHold = useCallback((callId?: string) => {
    const targetCallId = callId || activeCallId;
    if (!targetCallId) return;

    setActiveCalls(prev => prev.map(call => {
      if (call.id !== targetCallId) return call;
      const newIsOnHold = !call.isOnHold;
      return { 
        ...call, 
        isOnHold: newIsOnHold,
        status: newIsOnHold ? 'on-hold' : 'active'
      };
    }));
  }, [activeCallId]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllTimers();
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
    getCallById
  };
}
