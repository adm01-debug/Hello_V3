import { Phone, PhoneOff, Pause, Play, Users, Volume2, VolumeX, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CallSession, CallChannel } from '@/hooks/useMultiChannelCall';
import { formatDuration } from '@/data/mockData';
import { useHoldReminder } from '@/hooks/useHoldReminder';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActiveCallsIndicatorProps {
  activeCalls: CallSession[];
  activeCallId: string | null;
  onSwitchCall: (callId: string) => void;
  onEndCall: (callId: string) => void;
  onToggleHold: (callId: string) => void;
}

const channelLabels: Record<CallChannel, string> = {
  webrtc: 'WebRTC',
  wavoip: 'WhatsApp',
  sip: 'SIP'
};

export function ActiveCallsIndicator({
  activeCalls,
  activeCallId,
  onSwitchCall,
  onEndCall,
  onToggleHold
}: ActiveCallsIndicatorProps) {
  const { isEnabled, toggleReminder, callsOnHold, initAudio } = useHoldReminder(activeCalls);

  if (activeCalls.length === 0) return null;

  const handleToggleReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    initAudio(); // Initialize audio on user interaction
    toggleReminder();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 relative",
            activeCalls.length > 1 && "animate-pulse"
          )}
        >
          <Users className="h-4 w-4" />
          <span className="font-medium">{activeCalls.length} chamada{activeCalls.length > 1 ? 's' : ''}</span>
          {activeCalls.some(c => c.isOnHold) && (
            <Badge variant="secondary" className="ml-1 text-xs px-1">
              Em espera
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-medium">Chamadas Ativas</span>
            <div className="flex items-center gap-2">
              {callsOnHold.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        isEnabled ? "text-primary" : "text-muted-foreground"
                      )}
                      onClick={handleToggleReminder}
                    >
                      {isEnabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isEnabled ? 'Desativar lembrete sonoro' : 'Ativar lembrete sonoro'}
                  </TooltipContent>
                </Tooltip>
              )}
              <Badge variant="outline">{activeCalls.length}/3</Badge>
            </div>
          </div>
          
          {callsOnHold.length > 0 && (
            <div className="px-2 py-1.5 bg-warning/10 border border-warning/30 rounded-md flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-warning animate-pulse" />
              <span className="text-xs text-warning-foreground">
                {callsOnHold.length} chamada{callsOnHold.length > 1 ? 's' : ''} em espera • Lembrete a cada 30s
              </span>
            </div>
          )}
          
          {activeCalls.map((call) => (
            <div
              key={call.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                call.id === activeCallId 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-muted/50 hover:bg-muted",
                call.isOnHold && "opacity-60"
              )}
              onClick={() => onSwitchCall(call.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-white",
                  call.isOnHold ? "bg-warning" : "bg-success"
                )}>
                  {call.isOnHold ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {call.contactName || call.phoneNumber || 'Chamada'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{channelLabels[call.channel]}</span>
                    <span>•</span>
                    <span className="font-mono">{formatDuration(call.duration)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHold(call.id);
                  }}
                >
                  {call.isOnHold ? (
                    <Play className="h-3.5 w-3.5" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEndCall(call.id);
                  }}
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
