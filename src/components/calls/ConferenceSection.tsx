import { Users, X, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
 import { cn, formatDuration } from '@/lib/utils';
import { CallSession, ConferenceCall } from '@/hooks/useMultiChannelCall';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ConferenceSectionProps {
  conference: ConferenceCall;
  callsInConference: CallSession[];
  callsNotInConference: CallSession[];
  onRemoveFromConference: (callId: string) => void;
  onAddToConference: (callId: string) => void;
  onEndConference: () => void;
  onToggleConferenceRecording?: () => void;
}

export function ConferenceSection({
  conference, callsInConference, callsNotInConference,
  onRemoveFromConference, onAddToConference, onEndConference, onToggleConferenceRecording
}: ConferenceSectionProps) {
  return (
    <div className="p-3 bg-success/10 border border-success/30 rounded-md space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Conferência Ativa</p>
            <p className="text-xs text-muted-foreground">{callsInConference.length} participantes • {formatDuration(conference.duration)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={conference.isRecording ? "default" : "outline"} size="sm"
                className={cn("gap-1", conference.isRecording && "bg-destructive hover:bg-destructive/90")}
                onClick={onToggleConferenceRecording}>
                {conference.isRecording ? (<><Mic className="h-3 w-3 animate-pulse" /><span className="text-xs">REC</span></>) : (<><MicOff className="h-3 w-3" /><span className="text-xs">Gravar</span></>)}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{conference.isRecording ? 'Parar gravação' : 'Iniciar gravação'}</TooltipContent>
          </Tooltip>
          <Button variant="destructive" size="sm" onClick={onEndConference}>Encerrar</Button>
        </div>
      </div>

      {conference.isRecording && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded text-xs">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-destructive font-medium">Gravação automática ativa</span>
        </div>
      )}

      <div className="space-y-1">
        {callsInConference.map((call) => (
          <div key={call.id} className="flex items-center justify-between p-2 bg-background/50 rounded text-xs">
            <div className="flex items-center gap-2">
              <span>{call.contactName || call.phoneNumber || 'Chamada'}</span>
              {call.isRecording && <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveFromConference(call.id)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {callsNotInConference.length > 0 && (
        <div className="pt-2 border-t border-success/20">
          <p className="text-xs text-muted-foreground mb-1">Adicionar à conferência:</p>
          {callsNotInConference.map((call) => (
            <Button key={call.id} variant="ghost" size="sm" className="w-full justify-start gap-2 h-8" onClick={() => onAddToConference(call.id)}>
              <Users className="h-3 w-3" />
              {call.contactName || call.phoneNumber || 'Chamada'}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
