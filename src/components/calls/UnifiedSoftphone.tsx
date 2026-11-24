import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect } from 'react';
import { useConversation } from '@/lib/elevenlabs-stub';
import { AlertTriangle, Phone, Users, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { describeMicError } from '@/lib/audio/deviceTest';
import { SipConnectionStatus } from './SipConnectionStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { type CallSession } from '@/hooks/useMultiChannelCall';
import { useCallContext } from '@/contexts/CallContext';
import { useCallRecording } from '@/hooks/useCallRecording';
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

/** Espera antes da próxima tentativa de registro SIP: imediata, 5s, 10s, 20s e 30s (teto). */
function sipRetryDelayMs(attempt: number): number {
  return attempt === 0 ? 0 : Math.min(5000 * 2 ** (attempt - 1), 30000);
}

export function UnifiedSoftphone({ onCallStart, onCallEnd, onTranscript }: UnifiedSoftphoneProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'dialpad' | 'contacts' | 'history'>('dialpad');
  const [volume, setVolume] = useState(1);
  const [micError, setMicError] = useState<string | null>(null);
  const [sipAttempt, setSipAttempt] = useState(0);

  const {
    activeChannel, currentCall, activeCalls, activeCallId, callHistory, channels, conference,
    isInCall, canAddCall, setActiveChannel, initiateCall, switchToCall, updateCallStatus,
    endCall, toggleMute, toggleHold, toggleRecording, addTranscript, configureChannel,
    startConference, addToConference, removeFromConference, endConference, transferCall,
    completeTransfer, cancelTransfer, toggleConferenceRecording, currentSession,
  } = useCallContext();

  const wavoip = useWavoipCall();
  const sipCall = useSipCall();
  const sipConnect = sipCall.connect;
  const recording = useCallRecording();
  const { currentAgent, agents, setAgent, clearAgent, setStatusBusy, setStatusAvailable, setStatusAway } = useAgentStatus();

  useConferenceRecording({
    conference,
    onRecordingStarted: () => { logger.create('Softphone').debug('Conference recording started'); toast.info('Gravação da conferência iniciada'); },
    onRecordingSaved: (fp) => { logger.create('Softphone').debug('Conference recording saved:', fp); toast.success('Gravação da conferência salva', { description: fp }); },
  });

  useEffect(() => { if (wavoip.isConfigured) configureChannel('wavoip', { enabled: true, configured: true }); }, [wavoip.isConfigured, configureChannel]);
  // Registro SIP perdido: repete com espera crescente (5s → 30s) em vez de uma única tentativa muda.
  // sipConnect é estável (useCallback sem dependências em useSipCall), então pode entrar nas deps.
  useEffect(() => {
    if (activeChannel !== 'sip') return;
    if (sipCall.isRegistered) { setSipAttempt(0); return; }
    if (sipCall.status !== 'disconnected' && sipCall.status !== 'error') return;
    // Sem credencial configurada não há o que repetir: o banner orienta a cadastrar o tronco.
    if (sipCall.status === 'error' && !sipCall.isConfigured) return;
    const timer = window.setTimeout(() => {
      setSipAttempt(n => n + 1);
      void sipConnect();
    }, sipRetryDelayMs(sipAttempt));
    return () => window.clearTimeout(timer);
  }, [activeChannel, sipCall.isRegistered, sipCall.status, sipCall.isConfigured, sipAttempt, sipConnect]);
  // E070: injeta o UUID real do banco para evitar id sintético no relato de tronco
  // sipCall é estável (criado uma vez); setDbSessionId usa apenas um ref interno
  // Motivo: `sipCall` e o objeto do useSipCall, com identidade nova a cada render; incluido, a sessao seria reassinada sem parar.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { sipCall.setDbSessionId(currentSession?.id ?? null); }, [currentSession?.id]);

  const conversation = useConversation({
    onConnect: () => { logger.create('Softphone').debug('WebRTC connected'); updateCallStatus('active'); toast.success('Conectado'); },
    onDisconnect: () => { logger.create('Softphone').debug('WebRTC disconnected'); handleEndCall(); },
    onMessage: (message) => {
      const m = message as Record<string, Record<string, string>>;
      if (m.user_transcription_event?.user_transcript) { const t = m.user_transcription_event.user_transcript; addTranscript('user', t); onTranscript?.(t, 'user'); }
      else if (m.agent_response_event?.agent_response) { const t = m.agent_response_event.agent_response; addTranscript('agent', t); onTranscript?.(t, 'agent'); }
    },
    onError: (error) => {
      logger.error('Conversation error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro na conexão');
      handleEndCall();
    },
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
      } catch (error) {
        // Microfone negado/ausente: instrui o agente em vez de deixar a tela em silêncio.
        const motivo = describeMicError(error);
        logger.error('Microfone indisponível para chamada WebRTC:', error);
        setMicError(motivo);
        toast.error('Microfone indisponível', { description: motivo });
        if (activeCalls.length === 0) setStatusAvailable();
        return;
      }
      try {
        const call = await initiateCall('webrtc', undefined, 'Agente IA');
        if (!call) { toast.error('Não foi possível iniciar a chamada'); if (activeCalls.length === 0) setStatusAvailable(); return; }
        onCallStart?.(call);
        const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', { body: { useDefaultAgent: true } });
        if (error || !data?.signed_url) throw new Error(data?.error || 'Falha ao obter token');
        await conversation.startSession({ signedUrl: data.signed_url });
      } catch (error) { logger.error('Failed to start WebRTC call:', error); toast.error(error instanceof Error ? error.message : 'Falha ao iniciar chamada'); endCall(); }
    } else if (activeChannel === 'wavoip') {
      if (!phoneNumber) { toast.error('Digite um número WhatsApp para ligar'); return; }
      const call = await initiateCall('wavoip', phoneNumber, `WhatsApp ${phoneNumber}`);
      // Sem call aqui o motivo ja foi dito ao operador: limite de linhas no
      // guard do inicio, ou compliance dentro do proprio initiateCall.
      if (!call) return;
      onCallStart?.(call);
      const success = await wavoip.startCall(phoneNumber);
      if (success) updateCallStatus('active', call.id); else endCall(call.id);
    } else if (activeChannel === 'sip') {
      if (!phoneNumber) { toast.error('Digite um número para ligar'); return; }
      const call = await initiateCall('sip', phoneNumber);
      // Idem: o motivo da recusa ja foi comunicado.
      if (!call) return;
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

  const handleRecordToggle = useCallback(async () => {
    // Captura o audio da chamada e persiste no bucket antes de anunciar sucesso.
    if (recording.isRecording) {
      const filePath = await recording.stopAndSaveRecording({
        callSessionId: currentCall?.id,
        participantCount: currentCall?.isInConference ? activeCalls.length : 1,
      });
      toggleRecording();
      if (filePath) toast.success('Gravação salva', { description: filePath });
      else toast.error('Falha ao salvar a gravação');
      return;
    }

    const started = await recording.startRecording();
    if (!started) {
      toast.error('Não foi possível iniciar a gravação', {
        description: 'Verifique a permissão de microfone do navegador.',
      });
      return;
    }
    toggleRecording();
    toast.info('Gravação iniciada');
  }, [recording, toggleRecording, currentCall, activeCalls.length]);

  const handleSipRetryNow = useCallback(() => {
    setSipAttempt(n => n + 1);
    void sipConnect();
  }, [sipConnect]);

  // Estado do registro SIP do próprio softphone (a página usa outra instância do hook,
  // então o badge da página não reflete o que esta linha está fazendo).
  const sipDown = activeChannel === 'sip' && !sipCall.isRegistered
    && (sipCall.status === 'error' || sipCall.status === 'disconnected');
  const sipNextRetrySeconds = sipAttempt > 0 ? sipRetryDelayMs(sipAttempt) / 1000 : 0;
  const sipAlertTitle = sipDown && isInCall && currentCall?.channel === 'sip'
    ? 'A chamada caiu — a linha SIP saiu do ar'
    : sipCall.status === 'error' ? 'Linha SIP fora do ar' : 'Reconectando a linha SIP';
  const sipAlertDescription = sipCall.status === 'error'
    ? (sipCall.isConfigured
      ? `${sipCall.error ?? 'Não foi possível registrar no servidor SIP.'}${sipNextRetrySeconds > 0 ? ` Nova tentativa automática em ${sipNextRetrySeconds}s.` : ' Tentando novamente.'}`
      : 'A linha SIP não está configurada. Cadastre o tronco em Configurações → Telefonia para voltar a receber chamadas.')
    : sipNextRetrySeconds > 0
      ? `Sem registro no servidor SIP. Nova tentativa automática em ${sipNextRetrySeconds}s — as chamadas não entram enquanto a linha estiver fora do ar.`
      : 'Sem registro no servidor SIP no momento. Reconectando — as chamadas não entram enquanto a linha estiver fora do ar.';

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
              onTransferCall={transferCall} onCompleteTransfer={completeTransfer} onCancelTransfer={cancelTransfer} onToggleConferenceRecording={toggleConferenceRecording}
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

            <SipConnectionStatus status={sipCall.status} isRegistered={sipCall.isRegistered} error={sipCall.error} />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {micError && (
            <Alert variant="destructive" className="m-4 mb-0">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Microfone bloqueado</AlertTitle>
              <AlertDescription>
                <p>{micError}</p>
                <p>Clique no ícone de cadeado na barra de endereço, permita o microfone e ligue de novo.</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setMicError(null)}>
                  Fechar aviso
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {sipDown && (
            <Alert variant="destructive" className="m-4 mb-0">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{sipAlertTitle}</AlertTitle>
              <AlertDescription>
                <p>{sipAlertDescription}</p>
                <Button size="sm" variant="outline" className="mt-2 max-md:h-11" onClick={handleSipRetryNow}>
                  Tentar agora
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {isInCall && currentCall && (
            <ActiveCallDisplay
              currentCall={currentCall} activeChannel={activeChannel}
              channelName={channels.find(ch => ch.id === currentCall.channel)?.name ?? ''}
              isSpeaking={isSpeaking} volume={volume}
               onMuteToggle={handleMuteToggle} onHoldToggle={handleHoldToggle}
               onVolumeToggle={handleToggleVolume} onRecordToggle={handleRecordToggle}
               onEndCall={handleEndCall}
               onTransferCall={transferCall}
               onCompleteTransfer={completeTransfer}
               onCancelTransfer={cancelTransfer}
               pc={activeChannel === 'sip' ? sipCall.pc : null}
            />
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dialpad' | 'contacts' | 'history')} className="p-4">
            <TabsList className="grid w-full grid-cols-3 mb-4 max-md:h-11">
              <TabsTrigger value="dialpad" className="gap-1 text-xs max-md:h-11"><Phone className="h-3 w-3" />Teclado</TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1 text-xs max-md:h-11"><Users className="h-3 w-3" />Contatos</TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-xs max-md:h-11"><History className="h-3 w-3" />Recentes</TabsTrigger>
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
