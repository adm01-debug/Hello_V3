import { logger } from '@/lib/logger';
// @ts-nocheck
// UnifiedSoftphone component
import { useState, useCallback, useEffect } from 'react';
import { useConversation } from '@/lib/elevenlabs-stub';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause,
  Play,
  Volume2,
  VolumeX,
  PhoneForwarded,
  Delete,
  Radio,
  MessageCircle,
  Headphones,
  Waves,
  Loader2,
  Circle,
  Settings,
  History,
  Users,
  MoreVertical,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMultiChannelCall, CallChannel, CallSession } from '@/hooks/useMultiChannelCall';
import { useWavoipCall } from '@/hooks/useWavoipCall';
import { useConferenceRecording } from '@/hooks/useConferenceRecording';
import { useSipCall } from '@/hooks/useSipCall';
import { useAgentStatus } from '@/hooks/useAgentStatus';
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
import { ActiveCallsIndicator } from './ActiveCallsIndicator';
const dialPadButtons = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const channelIcons: Record<CallChannel, React.ComponentType<{ className?: string }>> = {
  webrtc: Radio,
  wavoip: MessageCircle,
  sip: Headphones
};

const channelColors: Record<CallChannel, string> = {
  webrtc: 'text-info',
  wavoip: 'text-success',
  sip: 'text-pending'
};

interface UnifiedSoftphoneProps {
  onCallStart?: (call: CallSession) => void;
  onCallEnd?: (call: CallSession) => void;
  onTranscript?: (text: string, speaker: 'user' | 'agent') => void;
}

export function UnifiedSoftphone({ onCallStart, onCallEnd, onTranscript }: UnifiedSoftphoneProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'dialpad' | 'contacts' | 'history'>('dialpad');
  const [volume, setVolume] = useState(1);
  
  const {
    activeChannel,
    currentCall,
    activeCalls,
    activeCallId,
    callHistory,
    channels,
    conference,
    isInCall,
    canAddCall,
    setActiveChannel,
    initiateCall,
    switchToCall,
    updateCallStatus,
    endCall,
    toggleMute,
    toggleHold,
    toggleRecording,
    addTranscript,
    configureChannel,
    startConference,
    addToConference,
    removeFromConference,
    endConference,
    transferCall,
    toggleConferenceRecording
  } = useMultiChannelCall();

  // Wavoip hook
  const wavoip = useWavoipCall();

  // SIP hook  
  const sipCall = useSipCall();

  // Agent status hook
  const { 
    currentAgent, 
    agents,
    setAgent,
    clearAgent,
    setStatusBusy, 
    setStatusAvailable,
    setStatusAway
  } = useAgentStatus();

  // Conference recording hook
  const { isRecording: isConferenceRecording, isSaving: isSavingRecording } = useConferenceRecording({
    conference,
    onRecordingStarted: () => {
      logger.create('Softphone').debug(' Conference recording started');
      toast.info('Gravação da conferência iniciada');
    },
    onRecordingSaved: (filePath) => {
      logger.create('Softphone').debug(' Conference recording saved:', filePath);
      toast.success('Gravação da conferência salva');
    }
  });

  // Update channel configuration based on Wavoip status
  useEffect(() => {
    if (wavoip.isConfigured) {
      configureChannel('wavoip', { enabled: true, configured: true });
    }
  }, [wavoip.isConfigured, configureChannel]);

  // Auto-connect SIP when channel is selected
  useEffect(() => {
    if (activeChannel === 'sip' && !sipCall.isRegistered && sipCall.status === 'disconnected') {
      sipCall.connect();
    }
  }, [activeChannel, sipCall.isRegistered, sipCall.status]);

  // ElevenLabs conversation hook for WebRTC
  const conversation = useConversation({
    onConnect: () => {
      logger.create('Softphone').debug('WebRTC connected');
      updateCallStatus('active');
      toast.success('Conectado');
    },
    onDisconnect: () => {
      logger.create('Softphone').debug('WebRTC disconnected');
      handleEndCall();
    },
    onMessage: (message) => {
      const msgAny = message as any;
      if (msgAny.user_transcription_event?.user_transcript) {
        const text = msgAny.user_transcription_event.user_transcript;
        addTranscript('user', text);
        onTranscript?.(text, 'user');
      } else if (msgAny.agent_response_event?.agent_response) {
        const text = msgAny.agent_response_event.agent_response;
        addTranscript('agent', text);
        onTranscript?.(text, 'agent');
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast.error('Erro na conexão');
      handleEndCall();
    },
  });

  const handleDigitPress = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
    // Send DTMF through appropriate channel
    if (isInCall && currentCall?.channel === 'sip') {
      sipCall.sendDTMF(digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleStartCall = useCallback(async () => {
    if (!canAddCall) {
      toast.error('Máximo de 3 chamadas simultâneas atingido');
      return;
    }

    // Update agent status to busy when starting first call
    if (activeCalls.length === 0) {
      setStatusBusy();
    }

    if (activeChannel === 'webrtc') {
      // WebRTC call with ElevenLabs
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const call = initiateCall('webrtc', undefined, 'Agente IA');
        if (!call) {
          toast.error('Não foi possível iniciar a chamada');
          // Revert status if call failed
          if (activeCalls.length === 0) setStatusAvailable();
          return;
        }
        onCallStart?.(call);
        
        // Get signed URL from edge function
        const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
          body: { useDefaultAgent: true }
        });

        if (error || !data?.signed_url) {
          throw new Error(data?.error || 'Falha ao obter token');
        }

        await conversation.startSession({
          signedUrl: data.signed_url,
        });
      } catch (error) {
        console.error('Failed to start WebRTC call:', error);
        toast.error(error instanceof Error ? error.message : 'Falha ao iniciar chamada');
        endCall();
      }
    } else if (activeChannel === 'wavoip') {
      // Wavoip WhatsApp call
      if (!phoneNumber) {
        toast.error('Digite um número WhatsApp para ligar');
        return;
      }

      const call = initiateCall('wavoip', phoneNumber, `WhatsApp ${phoneNumber}`);
      if (!call) {
        toast.error('Não foi possível iniciar a chamada');
        return;
      }
      onCallStart?.(call);

      const success = await wavoip.startCall(phoneNumber);
      if (success) {
        updateCallStatus('active', call.id);
      } else {
        endCall(call.id);
      }
    } else if (activeChannel === 'sip') {
      // Real SIP call via JsSIP
      if (!phoneNumber) {
        toast.error('Digite um número para ligar');
        return;
      }
      
      const call = initiateCall('sip', phoneNumber);
      if (!call) {
        toast.error('Não foi possível iniciar a chamada');
        return;
      }
      onCallStart?.(call);
      
      // Connect to SIP server if not already connected
      if (!sipCall.isRegistered) {
        updateCallStatus('connecting', call.id);
        const connected = await sipCall.connect();
        if (!connected) {
          toast.error('Falha ao conectar ao servidor SIP');
          endCall(call.id);
          if (activeCalls.length === 0) setStatusAvailable();
          return;
        }
        // Wait for registration
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Make the actual SIP call
      const success = await sipCall.startCall(phoneNumber);
      if (success) {
        updateCallStatus('ringing', call.id);
        // The SIP hook will fire events, we listen for active status
        const checkActive = setInterval(() => {
          if (sipCall.status === 'active') {
            updateCallStatus('active', call.id);
            clearInterval(checkActive);
          } else if (sipCall.status === 'registered' || sipCall.status === 'disconnected' || sipCall.status === 'error') {
            clearInterval(checkActive);
          }
        }, 500);
        // Timeout after 30s
        setTimeout(() => clearInterval(checkActive), 30000);
      } else {
        endCall(call.id);
        if (activeCalls.length === 0) setStatusAvailable();
      }
    }
  }, [activeChannel, phoneNumber, initiateCall, updateCallStatus, conversation, endCall, onCallStart, canAddCall, activeCalls.length, setStatusBusy, setStatusAvailable, sipCall]);

  const handleEndCall = useCallback(async () => {
    if (currentCall?.channel === 'webrtc') {
      conversation.endSession();
    } else if (currentCall?.channel === 'wavoip') {
      await wavoip.endCall();
    } else if (currentCall?.channel === 'sip') {
      sipCall.endCall();
    }
    
    if (currentCall) {
      onCallEnd?.(currentCall);
    }
    
    endCall();

    // Update agent status to available when ending last call
    // Check if this was the last active call (will be 1 because we haven't removed it yet)
    if (activeCalls.length <= 1) {
      setStatusAvailable();
    }
  }, [currentCall, conversation, wavoip, sipCall, endCall, onCallEnd, activeCalls.length, setStatusAvailable]);

  const handleToggleVolume = useCallback(async () => {
    const newVolume = volume > 0 ? 0 : 1;
    setVolume(newVolume);
    if (currentCall?.channel === 'webrtc') {
      await conversation.setVolume({ volume: newVolume });
    }
    toast.info(newVolume > 0 ? 'Som ativado' : 'Som desativado');
  }, [volume, currentCall, conversation]);

  const handleMuteToggle = useCallback(() => {
    toggleMute();
    if (currentCall?.channel === 'sip') {
      sipCall.toggleMute(!currentCall.isMuted);
    }
    toast.info(currentCall?.isMuted ? 'Microfone ativado' : 'Microfone desativado');
  }, [toggleMute, currentCall, sipCall]);

  const handleHoldToggle = useCallback(() => {
    toggleHold();
    if (currentCall?.channel === 'sip') {
      sipCall.toggleHold(!currentCall.isOnHold);
    }
    toast.info(currentCall?.isOnHold ? 'Chamada retomada' : 'Chamada em espera');
  }, [toggleHold, currentCall, sipCall]);


  const handleRecordToggle = useCallback(() => {
    toggleRecording();
    toast.info(currentCall?.isRecording ? 'Gravação parada' : 'Gravação iniciada');
  }, [toggleRecording, currentCall]);

  const quickContacts: { id: string; name: string; phone: string; favorite: boolean }[] = [];
  const enabledChannels = channels.filter(ch => ch.enabled);
  const ChannelIcon = channelIcons[activeChannel];
  const isSpeaking = conversation.isSpeaking;

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md mx-auto overflow-hidden">
        {/* Header with channel selector */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChannelIcon className={cn("h-5 w-5", channelColors[activeChannel])} />
              <div>
                <CardTitle className="text-lg">Softphone</CardTitle>
                <CardDescription className="text-xs flex items-center gap-2">
                  {currentAgent ? (
                    <>
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        currentAgent.status === 'available' ? "bg-success" :
                        currentAgent.status === 'busy' ? "bg-destructive" :
                        currentAgent.status === 'away' ? "bg-warning" : "bg-muted-foreground"
                      )} />
                      {currentAgent.name} ({currentAgent.status === 'available' ? 'Disponível' :
                        currentAgent.status === 'busy' ? 'Ocupado' :
                        currentAgent.status === 'away' ? 'Ausente' : 'Offline'})
                    </>
                  ) : (
                    channels.find(ch => ch.id === activeChannel)?.description
                  )}
                </CardDescription>
              </div>
            </div>

            {/* Active calls indicator */}
            <ActiveCallsIndicator
              activeCalls={activeCalls}
              activeCallId={activeCallId}
              conference={conference}
              onSwitchCall={switchToCall}
              onEndCall={endCall}
              onToggleHold={toggleHold}
              onStartConference={startConference}
              onAddToConference={addToConference}
              onRemoveFromConference={removeFromConference}
              onEndConference={endConference}
              onTransferCall={transferCall}
              onToggleConferenceRecording={toggleConferenceRecording}
            />
            
            {/* Agent selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {currentAgent ? (
                    <>
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        currentAgent.status === 'available' ? "bg-success" :
                        currentAgent.status === 'busy' ? "bg-destructive" :
                        currentAgent.status === 'away' ? "bg-warning" : "bg-muted-foreground"
                      )} />
                      <span className="text-xs max-w-20 truncate">{currentAgent.name.split(' ')[0]}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Selecionar Agente</span>
                  )}
                  <Users className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Selecionar Agente</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {agents.map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => setAgent(agent.id)}
                    disabled={isInCall && currentAgent?.id !== agent.id}
                    className="gap-2"
                  >
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      agent.status === 'available' ? "bg-success" :
                      agent.status === 'busy' ? "bg-destructive" :
                      agent.status === 'away' ? "bg-warning" : "bg-muted-foreground"
                    )} />
                    <span className="flex-1">{agent.name}</span>
                    {currentAgent?.id === agent.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                {currentAgent && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => setStatusAvailable()}
                      disabled={isInCall}
                      className="gap-2"
                    >
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Disponível
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setStatusAway()}
                      disabled={isInCall}
                      className="gap-2"
                    >
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      Ausente
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={clearAgent}
                      disabled={isInCall}
                      className="text-destructive"
                    >
                      Sair
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Channel dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {channels.find(ch => ch.id === activeChannel)?.name}
                  </Badge>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {channels.map((channel) => {
                  const Icon = channelIcons[channel.id];
                  return (
                    <DropdownMenuItem
                      key={channel.id}
                      onClick={() => !isInCall && setActiveChannel(channel.id)}
                      disabled={!channel.enabled || isInCall}
                      className="gap-2"
                    >
                      <Icon className={cn("h-4 w-4", channelColors[channel.id])} />
                      <span>{channel.name}</span>
                      {!channel.configured && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Config
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Active Call Display */}
          {isInCall && currentCall && (
            <div className={cn(
              "p-4 border-b transition-colors",
              currentCall.status === 'active' 
                ? isSpeaking ? "bg-primary/10" : "bg-success/10"
                : currentCall.status === 'on-hold'
                ? "bg-warning/10"
                : "bg-muted/50"
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    currentCall.status === 'active' ? "bg-success" : "bg-muted"
                  )}>
                    {currentCall.direction === 'inbound' ? (
                      <PhoneIncoming className="h-5 w-5 text-white" />
                    ) : (
                      <PhoneOutgoing className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {currentCall.contactName || currentCall.phoneNumber || 'Chamada Ativa'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ChannelIcon className="h-3 w-3" />
                      {channels.find(ch => ch.id === currentCall.channel)?.name}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold">
                    {formatDuration(currentCall.duration)}
                  </p>
                  <Badge 
                    variant={
                      currentCall.status === 'active' ? 'default' :
                      currentCall.status === 'on-hold' ? 'secondary' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {currentCall.status === 'connecting' && 'Conectando'}
                    {currentCall.status === 'ringing' && 'Chamando'}
                    {currentCall.status === 'active' && (isSpeaking ? 'Agente falando' : 'Ativo')}
                    {currentCall.status === 'on-hold' && 'Em espera'}
                  </Badge>
                </div>
              </div>

              {/* Recording indicator */}
              {currentCall.isRecording && (
                <div className="flex items-center gap-2 text-xs text-destructive mb-2">
                  <Circle className="h-2 w-2 fill-current animate-pulse" />
                  Gravando
                </div>
              )}

              {/* In-call transcripts */}
              {currentCall.transcripts.length > 0 && (
                <ScrollArea className="h-24 rounded border bg-background/50 p-2">
                  {currentCall.transcripts.slice(-5).map((t, i) => (
                    <p key={i} className={cn(
                      "text-xs mb-1",
                      t.role === 'user' ? "text-primary" : "text-muted-foreground"
                    )}>
                      <span className="font-medium">
                        {t.role === 'user' ? 'Você: ' : 'Agente: '}
                      </span>
                      {t.text}
                    </p>
                  ))}
                </ScrollArea>
              )}

              {/* In-call controls */}
              <div className="flex justify-center gap-2 mt-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full",
                        currentCall.isMuted && "bg-destructive/10 text-destructive border-destructive/30"
                      )}
                      onClick={handleMuteToggle}
                    >
                      {currentCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mudo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full",
                        currentCall.isOnHold && "bg-warning/10 text-warning border-warning/30"
                      )}
                      onClick={handleHoldToggle}
                    >
                      {currentCall.isOnHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Espera</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full",
                        volume === 0 && "bg-muted"
                      )}
                      onClick={handleToggleVolume}
                    >
                      {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Volume</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-11 w-11 rounded-full",
                        currentCall.isRecording && "bg-destructive/10 text-destructive border-destructive/30"
                      )}
                      onClick={handleRecordToggle}
                    >
                      <Circle className={cn("h-5 w-5", currentCall.isRecording && "fill-current")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Gravar</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-full"
                    >
                      <PhoneForwarded className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Transferir</TooltipContent>
                </Tooltip>

                <Button
                  variant="destructive"
                  size="icon"
                  className="h-11 w-11 rounded-full"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Main content tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="p-4">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="dialpad" className="gap-1 text-xs">
                <Phone className="h-3 w-3" />
                Teclado
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1 text-xs">
                <Users className="h-3 w-3" />
                Contatos
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs">
                <History className="h-3 w-3" />
                Recentes
              </TabsTrigger>
            </TabsList>

            {/* Dialpad Tab */}
            <TabsContent value="dialpad" className="space-y-4 mt-0">
              {/* Number display */}
              <div className="relative">
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={activeChannel === 'webrtc' ? 'Chamada IA' : 'Digite o número'}
                  className="h-12 text-center text-xl font-mono tracking-wider pr-10"
                  disabled={activeChannel === 'webrtc'}
                />
                {phoneNumber && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={handleBackspace}
                  >
                    <Delete className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Dialpad */}
              {activeChannel !== 'webrtc' && (
                <div className="grid grid-cols-3 gap-2">
                  {dialPadButtons.map(({ digit, letters }) => (
                    <Button
                      key={digit}
                      variant="outline"
                      className="h-14 flex-col gap-0 text-lg font-medium"
                      onClick={() => handleDigitPress(digit)}
                      disabled={isInCall}
                    >
                      <span>{digit}</span>
                      {letters && (
                        <span className="text-[9px] text-muted-foreground">{letters}</span>
                      )}
                    </Button>
                  ))}
                </div>
              )}

              {/* WebRTC info when selected */}
              {activeChannel === 'webrtc' && !isInCall && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Waves className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Chamada com Agente IA</p>
                      <p className="text-xs text-muted-foreground">
                        Converse naturalmente com o agente de voz
                      </p>
                    </div>
                  </div>
                  
                  <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                    <li>• Transcrição em tempo real</li>
                    <li>• Sem necessidade de número</li>
                    <li>• IA conversacional avançada</li>
                  </ul>
                </div>
              )}

              {/* Wavoip status */}
              {activeChannel === 'wavoip' && !isInCall && (
                <div className={cn(
                  "p-4 rounded-lg border text-center",
                  wavoip.isConfigured 
                    ? "border-success/30 bg-success/5" 
                    : "border-dashed border-warning/50 bg-warning/5"
                )}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MessageCircle className={cn(
                      "h-8 w-8",
                      wavoip.isConfigured ? "text-success" : "text-warning"
                    )} />
                    {wavoip.isConfigured ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  <p className={cn(
                    "font-medium",
                    wavoip.isConfigured ? "text-success" : "text-warning"
                  )}>
                    {wavoip.isConfigured ? 'WhatsApp Conectado' : 'WhatsApp Calls'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {wavoip.isConfigured 
                      ? 'Pronto para fazer chamadas de voz via WhatsApp'
                      : 'Configure o token Wavoip nas configurações'
                    }
                  </p>
                  {wavoip.isConfigured && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-success">Online</span>
                    </div>
                  )}
                  {wavoip.error && !wavoip.isConfigured && (
                    <p className="text-xs text-destructive mt-2">{wavoip.error}</p>
                  )}
                  {!wavoip.isConfigured && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 gap-2"
                      onClick={() => wavoip.checkConfiguration()}
                    >
                      <Settings className="h-3 w-3" />
                      Verificar Conexão
                    </Button>
                  )}
                </div>
              )}

              {/* Call button - show even when in call if can add more */}
              {(!isInCall || canAddCall) && (
                <Button
                  className={cn(
                    "w-full h-14 gap-2 text-lg",
                    activeChannel === 'wavoip' && wavoip.isConfigured && "bg-success hover:bg-success/90"
                  )}
                  onClick={handleStartCall}
                  disabled={
                    (activeChannel !== 'webrtc' && !phoneNumber) ||
                    (activeChannel === 'wavoip' && !wavoip.isConfigured) ||
                    !canAddCall
                  }
                >
                  {wavoip.status === 'connecting' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : activeChannel === 'wavoip' ? (
                    <MessageCircle className="h-5 w-5" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                  {isInCall ? (
                    <>Nova Chamada ({activeCalls.length}/3)</>
                  ) : (
                    activeChannel === 'webrtc' 
                      ? 'Iniciar Chamada IA' 
                      : activeChannel === 'wavoip' 
                      ? 'Ligar via WhatsApp' 
                      : 'Ligar'
                  )}
                </Button>
              )}
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-0">
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-2 gap-2">
                  {quickContacts.map((contact) => (
                    <Button
                      key={contact.id}
                      variant="outline"
                      className="h-auto flex-col gap-1 p-3"
                      onClick={() => {
                        if (activeChannel !== 'webrtc') {
                          setPhoneNumber(contact.phone.replace(/\D/g, ''));
                          setActiveTab('dialpad');
                        }
                        toast.info(`${contact.name} selecionado`);
                      }}
                      disabled={isInCall || activeChannel === 'webrtc'}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {getInitials(contact.name)}
                      </div>
                      <span className="text-xs font-medium truncate w-full">{contact.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate w-full">
                        {(contact as { company?: string }).company ?? ''}
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0">
              <ScrollArea className="h-[300px]">
                {callHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma chamada recente</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {callHistory.map((call) => {
                      const CallIcon = channelIcons[call.channel];
                      return (
                        <div
                          key={call.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                          onClick={() => {
                            if (call.phoneNumber) {
                              setPhoneNumber(call.phoneNumber);
                              setActiveTab('dialpad');
                            }
                          }}
                        >
                          <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center",
                            call.direction === 'inbound' ? "bg-info/10" : "bg-success/10"
                          )}>
                            {call.direction === 'inbound' ? (
                              <PhoneIncoming className="h-4 w-4 text-info" />
                            ) : (
                              <PhoneOutgoing className="h-4 w-4 text-success" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {call.contactName || call.phoneNumber || 'Chamada'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <CallIcon className="h-3 w-3" />
                              {formatDuration(call.duration)}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
