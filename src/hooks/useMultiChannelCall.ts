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
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [channels, setChannels] = useState<ChannelConfig[]>(AVAILABLE_CHANNELS);
  
  const durationIntervalRef = useRef<number | null>(null);

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    durationIntervalRef.current = window.setInterval(() => {
      setCurrentCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
    }, 1000);
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Initialize a new call
  const initiateCall = useCallback((
    channel: CallChannel,
    phoneNumber?: string,
    contactName?: string
  ) => {
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
    
    setCurrentCall(newCall);
    setActiveChannel(channel);
    
    return newCall;
  }, []);

  // Update call status
  const updateCallStatus = useCallback((status: CallStatus) => {
    setCurrentCall(prev => {
      if (!prev) return null;
      
      if (status === 'active' && prev.status !== 'active') {
        startDurationTimer();
      }
      
      return { ...prev, status };
    });
  }, [startDurationTimer]);

  // End current call
  const endCall = useCallback(() => {
    stopDurationTimer();
    
    if (currentCall) {
      const endedCall: CallSession = {
        ...currentCall,
        status: 'ended'
      };
      setCallHistory(prev => [endedCall, ...prev].slice(0, 50));
    }
    
    setCurrentCall(null);
  }, [currentCall, stopDurationTimer]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setCurrentCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
  }, []);

  // Toggle hold
  const toggleHold = useCallback(() => {
    setCurrentCall(prev => {
      if (!prev) return null;
      const newIsOnHold = !prev.isOnHold;
      return { 
        ...prev, 
        isOnHold: newIsOnHold,
        status: newIsOnHold ? 'on-hold' : 'active'
      };
    });
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    setCurrentCall(prev => prev ? { ...prev, isRecording: !prev.isRecording } : null);
  }, []);

  // Add transcript
  const addTranscript = useCallback((role: 'user' | 'agent' | 'system', text: string) => {
    setCurrentCall(prev => {
      if (!prev) return null;
      return {
        ...prev,
        transcripts: [
          ...prev.transcripts,
          { role, text, timestamp: new Date() }
        ]
      };
    });
  }, []);

  // Configure channel
  const configureChannel = useCallback((channelId: CallChannel, config: Partial<ChannelConfig>) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, ...config } : ch
    ));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
    };
  }, [stopDurationTimer]);

  return {
    // State
    activeChannel,
    currentCall,
    callHistory,
    channels,
    isInCall: currentCall !== null && currentCall.status !== 'ended',
    
    // Actions
    setActiveChannel,
    initiateCall,
    updateCallStatus,
    endCall,
    toggleMute,
    toggleHold,
    toggleRecording,
    addTranscript,
    configureChannel
  };
}
