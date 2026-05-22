import {
   PhoneIncoming, PhoneOutgoing, Mic, MicOff, Pause, Play,
   Volume2, VolumeX, PhoneForwarded, PhoneOff, Circle, AudioLines,
   Zap, Activity, Smile, Frown, Meh
} from 'lucide-react';

import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
 import type { CallSession, CallChannel } from '@/hooks/useMultiChannelCall';
 import { VoipQualityIndicator } from '../VoipQualityIndicator';
import { channelIcons, formatCallDuration } from './constants';

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
   pc?: RTCPeerConnection | null;
}

export function ActiveCallDisplay({
  currentCall, activeChannel, channelName, isSpeaking, volume,
   onMuteToggle, onHoldToggle, onVolumeToggle, onRecordToggle, onEndCall, pc,
}: ActiveCallDisplayProps) {
  const ChannelIcon = channelIcons[activeChannel];
  const { isListening, isProcessing, lastCommand, startListening, stopListening } = useVoiceCommand();

  return (
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
          
          {/* Sentiment Indicator (Mock/placeholder for real sentiment) */}
          {currentCall.status === 'active' && (
            <div className="flex items-center gap-1 mt-1 justify-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Humor</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="h-5 px-1 bg-background/50">
                    <Smile className="h-3 w-3 text-success" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Sentimento do cliente: Positivo</TooltipContent>
              </Tooltip>
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
          <span className="text-[10px] text-primary font-medium">Comando: {lastCommand}</span>
        </div>
      )}

      <div className="flex justify-center gap-2 mt-3">

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon"
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
            <Button variant="outline" size="icon"
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
            <Button variant="outline" size="icon"
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
            <Button variant="outline" size="icon"
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
            <Button variant="outline" size="icon"
              className={cn("h-11 w-11 rounded-full", (isListening || isProcessing) && "bg-primary/10 text-primary border-primary/30")}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
            >
              <AudioLines className={cn("h-5 w-5", isListening && "animate-pulse")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isListening ? 'Parar comando de voz' : isProcessing ? 'Processando...' : 'Comando de voz'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-full">
              <PhoneForwarded className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Transferir</TooltipContent>
        </Tooltip>

        <Button variant="destructive" size="icon" className="h-11 w-11 rounded-full" onClick={onEndCall}>
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
