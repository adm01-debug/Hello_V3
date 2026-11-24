import { useState } from 'react';
import { PhoneIncoming, PhoneOutgoing, Mic, MicOff, Pause, Play, Volume2, VolumeX, PhoneForwarded, PhoneOff, Circle, AudioLines, Zap, Activity, Smile, Meh, Frown, Check, X } from 'lucide-react';

import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
 import type { CallSession, CallChannel, TransferTarget, TransferType } from '@/hooks/useMultiChannelCall';
 import { VoipQualityIndicator } from '../VoipQualityIndicator';
import { TransferCallDialog } from '../TransferCallDialog';
import { channelIcons, formatCallDuration } from './constants';

const sentimentVisual: Record<
  'positive' | 'neutral' | 'negative' | 'mixed',
  { label: string; icon: JSX.Element }
> = {
  positive: { label: 'Positivo', icon: <Smile className="h-3 w-3 text-success" /> },
  neutral: { label: 'Neutro', icon: <Meh className="h-3 w-3 text-muted-foreground" /> },
  negative: { label: 'Negativo', icon: <Frown className="h-3 w-3 text-destructive" /> },
  mixed: { label: 'Misto', icon: <Activity className="h-3 w-3 text-warning" /> },
};
import { useLiveSentiment } from '@/hooks/useLiveSentiment';

interface ActiveCallDisplayProps {
  currentCall: CallSession;
  activeChannel: CallChannel;
  channelName: string;
  isSpeaking: boolean;
  volume: number;
  onMuteToggle: () => void;
  onHoldToggle: () => void;
  onVolumeToggle: () => void;
  onRecordToggle: () => void;
   onEndCall: () => void;
   onTransferCall: (callId: string, target: TransferTarget, transferType: TransferType) => void;
   onCompleteTransfer: (callId: string) => void;
   onCancelTransfer: (callId: string) => void;
   pc?: RTCPeerConnection | null;
}

export function ActiveCallDisplay({
  currentCall, activeChannel, channelName, isSpeaking, volume,
   onMuteToggle, onHoldToggle, onVolumeToggle, onRecordToggle, onEndCall,
   onTransferCall, onCompleteTransfer, onCancelTransfer, pc,
}: ActiveCallDisplayProps) {
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const ChannelIcon = channelIcons[activeChannel];
  const { isListening, isProcessing, lastCommand, startListening, stopListening } = useVoiceCommand();

  // Humor real da chamada: usa o último snapshot gravado em `live_sentiment_snapshots`
  // pela análise de transcrição. Sem snapshot não há como afirmar sentimento — a UI
  // mostra "sem análise" em vez de um "Positivo" inventado.
  const { snapshots } = useLiveSentiment(currentCall.dbSessionId);
  const latestSentiment = snapshots.length > 0 ? snapshots[snapshots.length - 1] : undefined;

  return (
    <>
    <div className={cn(
      "p-4 border-b transition-colors",
      currentCall.status === 'active'
        ? isSpeaking ? "bg-primary/10" : "bg-success/10"
        : currentCall.status === 'on-hold' ? "bg-warning/10" : "bg-muted/50"
    )}>
       <div className="flex items-start justify-between mb-3">
         <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            currentCall.status === 'active' ? "bg-success" : "bg-muted"
          )}>
            {currentCall.direction === 'inbound'
              ? <PhoneIncoming className="h-5 w-5 text-white" />
              : <PhoneOutgoing className="h-5 w-5 text-white" />}
           </div>
           <div>
             <p className="font-medium">
               {currentCall.contactName || currentCall.phoneNumber || 'Chamada Ativa'}
             </p>
             <p className="text-xs text-muted-foreground flex items-center gap-1">
               <ChannelIcon className="h-3 w-3" />
               {channelName}
             </p>
           </div>
           </div>
           
           {/* VoIP Quality Indicator */}
           {activeChannel === 'sip' && (
             <div className="mt-1">
               <VoipQualityIndicator pc={pc || null} callSessionId={currentCall.dbSessionId} />
             </div>
           )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">{formatCallDuration(currentCall.duration)}</p>
          <Badge
            variant={currentCall.status === 'active' ? 'default' : currentCall.status === 'on-hold' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {currentCall.status === 'connecting' && 'Conectando'}
            {currentCall.status === 'ringing' && 'Chamando'}
            {currentCall.status === 'active' && (isSpeaking ? 'Agente falando' : 'Ativo')}
            {currentCall.status === 'on-hold' && 'Em espera'}
          </Badge>
          
          {/* Humor do cliente — vem de live_sentiment_snapshots, não é fixo */}
          {currentCall.status === 'active' && (
            <div className="flex items-center gap-1 mt-1 justify-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Humor</span>
              {latestSentiment ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 px-1 bg-background/50 gap-1">
                      {sentimentVisual[latestSentiment.sentiment].icon}
                      <span className="text-[10px] font-medium">{sentimentVisual[latestSentiment.sentiment].label}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sentimento do cliente: {sentimentVisual[latestSentiment.sentiment].label}</p>
                    {latestSentiment.emotion && <p className="text-xs text-muted-foreground">Emoção: {latestSentiment.emotion}</p>}
                    {latestSentiment.score !== null && <p className="text-xs text-muted-foreground">Score: {latestSentiment.score}</p>}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 px-1 bg-background/50 gap-1 text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span className="text-[10px] font-medium">Sem análise</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Nenhuma análise de sentimento registrada para esta chamada ainda</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {currentCall.isRecording && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <Circle className="h-2 w-2 fill-current animate-pulse" />
              Gravando
            </div>
          )}
        </div>
        
        {/* Signal/Network Info */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>Latência: 45ms</span>
          <span className="border-l pl-2">Codec: OPUS</span>
        </div>
      </div>

      {currentCall.transcripts.length > 0 && (
        <ScrollArea className="h-24 rounded border bg-background/50 p-2">
          {currentCall.transcripts.slice(-5).map((t, i) => (
            <p key={i} className={cn("text-xs mb-1", t.role === 'user' ? "text-primary" : "text-muted-foreground")}>
              <span className="font-medium">{t.role === 'user' ? 'Você: ' : 'Agente: '}</span>
              {t.text}
            </p>
          ))}
        </ScrollArea>
      )}

      {lastCommand && (
        <div className="mb-2 px-2 py-1 bg-primary/5 rounded border border-primary/10 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Zap className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-primary font-medium">Comando: {lastCommand.command}</span>
        </div>
      )}

      <div className="flex justify-center gap-2 mt-3">

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label={currentCall.isMuted ? 'Ativar o microfone' : 'Silenciar o microfone'} aria-pressed={currentCall.isMuted} variant="outline" size="icon"
              className={cn("h-11 w-11 rounded-full", currentCall.isMuted && "bg-destructive/10 text-destructive border-destructive/30")}
              onClick={onMuteToggle}
            >
              {currentCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mudo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label={currentCall.isOnHold ? 'Retomar a chamada' : 'Colocar a chamada em espera'} aria-pressed={currentCall.isOnHold} variant="outline" size="icon"
              className={cn("h-11 w-11 rounded-full", currentCall.isOnHold && "bg-warning/10 text-warning border-warning/30")}
              onClick={onHoldToggle}
            >
              {currentCall.isOnHold ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Espera</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label={volume > 0 ? 'Desligar o alto-falante' : 'Ligar o alto-falante'} aria-pressed={volume === 0} variant="outline" size="icon"
              className={cn("h-11 w-11 rounded-full", volume === 0 && "bg-muted")}
              onClick={onVolumeToggle}
            >
              {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Volume</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label={currentCall.isRecording ? 'Parar a gravação' : 'Iniciar a gravação'} aria-pressed={currentCall.isRecording} variant="outline" size="icon"
              className={cn("h-11 w-11 rounded-full", currentCall.isRecording && "bg-destructive/10 text-destructive border-destructive/30")}
              onClick={onRecordToggle}
            >
              <Circle className={cn("h-5 w-5", currentCall.isRecording && "fill-current")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Gravar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label={isListening ? 'Parar o comando de voz' : 'Comando de voz'} aria-pressed={isListening} variant="outline" size="icon"
              className={cn("h-11 w-11 rounded-full", (isListening || isProcessing) && "bg-primary/10 text-primary border-primary/30")}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
            >
              <AudioLines className={cn("h-5 w-5", isListening && "animate-pulse")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isListening ? 'Parar comando de voz' : isProcessing ? 'Processando...' : 'Comando de voz'}</TooltipContent>
        </Tooltip>

        {currentCall.isTransferring ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Confirmar a transferência" variant="outline" size="icon" className="h-11 w-11 rounded-full text-success border-success/40"
                  onClick={() => onCompleteTransfer(currentCall.id)}
                >
                  <Check className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Confirmar transferência</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Cancelar a transferência" variant="outline" size="icon" className="h-11 w-11 rounded-full"
                  onClick={() => onCancelTransfer(currentCall.id)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancelar transferência</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button aria-label="Transferir a chamada" variant="outline" size="icon" className="h-11 w-11 rounded-full"
                onClick={() => setTransferDialogOpen(true)}
              >
                <PhoneForwarded className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Transferir</TooltipContent>
          </Tooltip>
        )}

        <Button aria-label="Encerrar a chamada" variant="destructive" size="icon" className="h-11 w-11 rounded-full" onClick={onEndCall}>
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>

    <TransferCallDialog
      open={transferDialogOpen}
      onOpenChange={setTransferDialogOpen}
      callId={currentCall.id}
      callerName={currentCall.contactName || currentCall.phoneNumber}
      onTransfer={(callId, target, type) => {
        onTransferCall(callId, target, type);
        // Transferência assistida: aguarda confirmação explícita (via botão do botão no estado isTransferring)
        // Transferência cega: também exige confirmação explícita — ver useCallTransfer.ts:7-11
      }}
    />
    </>
  );
}
