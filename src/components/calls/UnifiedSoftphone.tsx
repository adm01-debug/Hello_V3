import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect } from 'react';
import { useConversation } from '@/lib/elevenlabs-stub';
import { Phone, Users, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMultiChannelCall, type CallSession } from '@/hooks/useMultiChannelCall';
import { useWavoipCall } from '@/hooks/useWavoipCall';
import { useConferenceRecording } from '@/hooks/useConferenceRecording';
import { useSipCall } from '@/hooks/useSipCall';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { ActiveCallsIndicator } from './ActiveCallsIndicator';
import { ActiveCallDisplay } from './softphone/ActiveCallDisplay';
import { DialpadTab } from './softphone/DialpadTab';
import { ContactsTab, HistoryTab } from './softphone/TabContents';
import { AgentSelector, ChannelSelector } from './softphone/HeaderDropdowns';
import { channelIcons, channelColors } from './softphone/constants';

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
    activeChannel, currentCall, activeCalls, activeCallId, callHistory, channels, conference,
    isInCall, canAddCall, setActiveChannel, initiateCall, switchToCall, updateCallStatus,
    endCall, toggleMute, toggleHold, toggleRecording, addTranscript, configureChannel,
    startConference, addToConference, removeFromConference, endConference, transferCall,
    toggleConferenceRecording,
  } = useMultiChannelCall();

  const wavoip = useWavoipCall();
  const sipCall = useSipCall();
  const { currentAgent, agents, setAgent, clearAgent, setStatusBusy, setStatusAvailable, setStatusAway } = useAgentStatus();

  useConferenceRecording({
    conference,
    onRecordingStarted: () => { logger.create('Softphone').debug('Conference recording started'); toast.info('Gravação da conferência iniciada'); },
    onRecordingSaved: (fp) => { logger.create('Softphone').debug('Conference recording saved:', fp); toast.success('Gravação da conferência salva'); },
  });

  useEffect(() => { if (wavoip.isConfigured) configureChannel('wavoip', { enabled: true, configured: true }); }, [wavoip.isConfigured, configureChannel]);
  useEffect(() => { if (activeChannel === 'sip' && !sipCall.isRegistered && sipCall.status === 'disconnected') sipCall.connect(); }, [activeChannel, sipCall.isRegistered, sipCall.status]);

  const conversation = useConversation({
    onConnect: () => { logger.create('Softphone').debug('WebRTC connected'); updateCallStatus('active'); toast.success('Conectado'); },
    onDisconnect: () => { logger.create('Softphone').debug('WebRTC disconnected'); handleEndCall(); },
    onMessage: (message) => {
      const m = message as Record<string, Record<string, string>>;
      if (m.user_transcription_event?.user_transcript) { const t = m.user_transcription_event.user_transcript; addTranscript('user', t); onTranscript?.(t, 'user'); }
      else if (m.agent_response_event?.agent_response) { const t = m.agent_response_event.agent_response; addTranscript('agent', t); onTranscript?.(t, 'agent'); }
    },
    onError: (error) => { logger.error('Conversation error:', error); toast.error('Erro na conexão'); handleEndCall(); },
  });

  const handleDigitPress = (digit: string) => {
    setPhoneNumber(p => p + digit);
    if (isInCall && currentCall?.channel === 'sip') sipCall.sendDTMF(digit);
  };

  const handleStartCall = useCallback(async () => {
    if (!canAddCall) { toast.error('Máximo de 3 chamadas simultâneas atingido'); return; }
    if (activeCalls.length === 0) setStatusBusy();

    if (activeChannel === 'webrtc') {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const call = initiateCall('webrtc', undefined, 'Agente IA');
        if (!call) { toast.error('Não foi possível iniciar a chamada'); if (activeCalls.length === 0) setStatusAvailable(); return; }
        onCallStart?.(call);
        const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', { body: { useDefaultAgent: true } });
        if (error || !data?.signed_url) throw new Error(data?.error || 'Falha ao obter token');
        await conversation.startSession({ signedUrl: data.signed_url });
      } catch (error) { logger.error('Failed to start WebRTC call:', error); toast.error(error instanceof Error ? error.message : 'Falha ao iniciar chamada'); endCall(); }
    } else if (activeChannel === 'wavoip') {
      if (!phoneNumber) { toast.error('Digite um número WhatsApp para ligar'); return; }
      const call = initiateCall('wavoip', phoneNumber, `WhatsApp ${phoneNumber}`);
      if (!call) { toast.error('Não foi possível iniciar a chamada'); return; }
      onCallStart?.(call);
      const success = await wavoip.startCall(phoneNumber);
      if (success) updateCallStatus('active', call.id); else endCall(call.id);
    } else if (activeChannel === 'sip') {
      if (!phoneNumber) { toast.error('Digite um número para ligar'); return; }
      const call = initiateCall('sip', phoneNumber);
      if (!call) { toast.error('Não foi possível iniciar a chamada'); return; }
      onCallStart?.(call);
      if (!sipCall.isRegistered) {
        updateCallStatus('connecting', call.id);
        const connected = await sipCall.connect();
        if (!connected) { toast.error('Falha ao conectar ao servidor SIP'); endCall(call.id); if (activeCalls.length === 0) setStatusAvailable(); return; }
        await new Promise(r => setTimeout(r, 3000));
      }
      const success = await sipCall.startCall(phoneNumber);
      if (success) {
        updateCallStatus('ringing', call.id);
        const check = setInterval(() => {
          if (sipCall.status === 'active') { updateCallStatus('active', call.id); clearInterval(check); }
          else if (['registered', 'disconnected', 'error'].includes(sipCall.status)) clearInterval(check);
        }, 500);
        setTimeout(() => clearInterval(check), 30000);
      } else { endCall(call.id); if (activeCalls.length === 0) setStatusAvailable(); }
    }
  }, [activeChannel, phoneNumber, initiateCall, updateCallStatus, conversation, endCall, onCallStart, canAddCall, activeCalls.length, setStatusBusy, setStatusAvailable, sipCall, wavoip]);

  const handleEndCall = useCallback(async () => {
    if (currentCall?.channel === 'webrtc') conversation.endSession();
    else if (currentCall?.channel === 'wavoip') await wavoip.endCall();
    else if (currentCall?.channel === 'sip') sipCall.endCall();
    if (currentCall) onCallEnd?.(currentCall);
    endCall();
    if (activeCalls.length <= 1) setStatusAvailable();
  }, [currentCall, conversation, wavoip, sipCall, endCall, onCallEnd, activeCalls.length, setStatusAvailable]);

  const handleToggleVolume = useCallback(async () => {
    const nv = volume > 0 ? 0 : 1;
    setVolume(nv);
    if (currentCall?.channel === 'webrtc') await conversation.setVolume({ volume: nv });
    toast.info(nv > 0 ? 'Som ativado' : 'Som desativado');
  }, [volume, currentCall, conversation]);

  const handleMuteToggle = useCallback(() => {
    toggleMute();
    if (currentCall?.channel === 'sip') sipCall.toggleMute(!currentCall.isMuted);
    toast.info(currentCall?.isMuted ? 'Microfone ativado' : 'Microfone desativado');
  }, [toggleMute, currentCall, sipCall]);

  const handleHoldToggle = useCallback(() => {
    toggleHold();
    if (currentCall?.channel === 'sip') sipCall.toggleHold(!currentCall.isOnHold);
    toast.info(currentCall?.isOnHold ? 'Chamada retomada' : 'Chamada em espera');
  }, [toggleHold, currentCall, sipCall]);

  const handleRecordToggle = useCallback(() => {
    toggleRecording();
    toast.info(currentCall?.isRecording ? 'Gravação parada' : 'Gravação iniciada');
  }, [toggleRecording, currentCall]);

  const ChannelIcon = channelIcons[activeChannel];
  const isSpeaking = conversation.isSpeaking;

  return (
    <TooltipProvider>
      <Card className="w-full max-w-md mx-auto overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChannelIcon className={cn("h-5 w-5", channelColors[activeChannel])} />
              <div>
                <CardTitle className="text-lg">Softphone</CardTitle>
                <CardDescription className="text-xs flex items-center gap-2">
                  {currentAgent ? (
                    <>
                      <span className={cn("h-2 w-2 rounded-full",
                        currentAgent.status === 'available' ? "bg-success" :
                        currentAgent.status === 'busy' ? "bg-destructive" :
                        currentAgent.status === 'away' ? "bg-warning" : "bg-muted-foreground"
                      )} />
                      {currentAgent.name} ({currentAgent.status === 'available' ? 'Disponível' :
                        currentAgent.status === 'busy' ? 'Ocupado' :
                        currentAgent.status === 'away' ? 'Ausente' : 'Offline'})
                    </>
                  ) : channels.find(ch => ch.id === activeChannel)?.description}
                </CardDescription>
              </div>
            </div>

            <ActiveCallsIndicator
              activeCalls={activeCalls} activeCallId={activeCallId} conference={conference}
              onSwitchCall={switchToCall} onEndCall={endCall} onToggleHold={toggleHold}
              onStartConference={startConference} onAddToConference={addToConference}
              onRemoveFromConference={removeFromConference} onEndConference={endConference}
              onTransferCall={transferCall} onToggleConferenceRecording={toggleConferenceRecording}
            />

            <AgentSelector
              currentAgent={currentAgent} agents={agents} isInCall={isInCall}
              onSetAgent={setAgent} onClearAgent={clearAgent}
              onSetAvailable={setStatusAvailable} onSetAway={setStatusAway}
            />

            <ChannelSelector
              channels={channels} activeChannel={activeChannel}
              isInCall={isInCall} onSetChannel={setActiveChannel}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isInCall && currentCall && (
            <ActiveCallDisplay
              currentCall={currentCall} activeChannel={activeChannel}
              channelName={channels.find(ch => ch.id === currentCall.channel)?.name ?? ''}
              isSpeaking={isSpeaking} volume={volume}
               onMuteToggle={handleMuteToggle} onHoldToggle={handleHoldToggle}
               onVolumeToggle={handleToggleVolume} onRecordToggle={handleRecordToggle}
               onEndCall={handleEndCall}
               pc={activeChannel === 'sip' ? sipCall.pc : null}
            />
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dialpad' | 'contacts' | 'history')} className="p-4">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="dialpad" className="gap-1 text-xs"><Phone className="h-3 w-3" />Teclado</TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1 text-xs"><Users className="h-3 w-3" />Contatos</TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs"><History className="h-3 w-3" />Recentes</TabsTrigger>
            </TabsList>

            <TabsContent value="dialpad" className="mt-0">
              <DialpadTab
                activeChannel={activeChannel} phoneNumber={phoneNumber}
                isInCall={isInCall} canAddCall={canAddCall} activeCalls={activeCalls}
                wavoipConfigured={wavoip.isConfigured} wavoipStatus={wavoip.status}
                wavoipError={wavoip.error}
                onPhoneChange={setPhoneNumber}
                onDigitPress={handleDigitPress}
                onBackspace={() => setPhoneNumber(p => p.slice(0, -1))}
                onStartCall={handleStartCall}
                onCheckWavoip={() => wavoip.checkConfiguration()}
              />
            </TabsContent>

            <TabsContent value="contacts" className="mt-0">
              <ContactsTab
                quickContacts={[]} isInCall={isInCall} activeChannel={activeChannel}
                onSelectContact={(phone, name) => { setPhoneNumber(phone); setActiveTab('dialpad'); toast.info(`${name} selecionado`); }}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <HistoryTab
                callHistory={callHistory}
                onSelectNumber={(phone) => { setPhoneNumber(phone); setActiveTab('dialpad'); }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
