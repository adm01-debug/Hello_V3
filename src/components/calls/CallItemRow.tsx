import { Phone, PhoneOff, Pause, Play, Users, PhoneForwarded, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { CallSession, CallChannel } from '@/hooks/useMultiChannelCall';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const channelLabels: Record<CallChannel, string> = {
  webrtc: 'WebRTC',
  wavoip: 'WhatsApp',
  sip: 'SIP'
};

interface CallItemRowProps {
  call: CallSession;
  isActive: boolean;
  isSelectingForConference: boolean;
  isSelectedForConference: boolean;
  onSwitchCall: (callId: string) => void;
  onToggleHold: (callId: string) => void;
  onEndCall: (callId: string) => void;
  onOpenTransferDialog: (callId: string) => void;
  onToggleSelectForConference: (callId: string) => void;
}

export function CallItemRow({
  call, isActive, isSelectingForConference, isSelectedForConference,
  onSwitchCall, onToggleHold, onEndCall, onOpenTransferDialog, onToggleSelectForConference,
}: CallItemRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors",
        isActive ? "bg-primary/10 border-primary/30" : "bg-muted/50 hover:bg-muted",
        call.isOnHold && "opacity-60",
        call.isInConference && "border-success/30 bg-success/5"
      )}
    >
      <div
        className="flex items-center gap-3 cursor-pointer flex-1"
        onClick={() => !isSelectingForConference && onSwitchCall(call.id)}
      >
        {isSelectingForConference && !call.isInConference ? (
          <Checkbox
            checked={isSelectedForConference}
            onCheckedChange={() => onToggleSelectForConference(call.id)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-white",
            call.isInConference ? "bg-success" : call.isOnHold ? "bg-warning" : "bg-success"
          )}>
            {call.isInConference ? <Users className="h-4 w-4" /> : call.isOnHold ? <Pause className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{call.contactName || call.phoneNumber || 'Chamada'}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{channelLabels[call.channel]}</span>
            <span>•</span>
            <span className="font-mono">{formatDuration(call.duration)}</span>
            {call.totalHoldTime > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-0.5 text-warning cursor-help">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono">{formatDuration(call.totalHoldTime)}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p>Tempo em espera: {formatDuration(call.totalHoldTime)}</p>
                    <p className="text-muted-foreground">Em espera {call.holdCount}x</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {call.isInConference && (
              <>
                <span>•</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0">Conferência</Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {!isSelectingForConference && !call.isInConference && (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); onOpenTransferDialog(call.id); }}
                disabled={call.isTransferring}
              >
                <PhoneForwarded className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Transferir</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); onToggleHold(call.id); }}
          >
            {call.isOnHold ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onEndCall(call.id); }}
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {call.isTransferring && (
        <Badge variant="outline" className="text-xs animate-pulse">Transferindo...</Badge>
      )}
    </div>
  );
}
