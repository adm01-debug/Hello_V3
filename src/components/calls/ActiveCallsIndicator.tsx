import { useState } from 'react';
import { Phone, PhoneOff, Pause, Play, Users, Bell, Merge, X, PhoneForwarded, Clock, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
 import { cn, formatDuration } from '@/lib/utils';
import { CallSession, CallChannel, ConferenceCall, TransferTarget, TransferType } from '@/hooks/useMultiChannelCall';
import { useHoldReminder } from '@/hooks/useHoldReminder';
import { TransferCallDialog } from './TransferCallDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { HoldReminderSettings } from './HoldReminderSettings';
import { ConferenceSection } from './ConferenceSection';

interface ActiveCallsIndicatorProps {
  activeCalls: CallSession[];
  activeCallId: string | null;
  conference: ConferenceCall | null;
  onSwitchCall: (callId: string) => void;
  onEndCall: (callId: string) => void;
  onToggleHold: (callId: string) => void;
  onStartConference: (callIds: string[]) => void;
  onAddToConference: (callId: string) => void;
  onRemoveFromConference: (callId: string) => void;
  onEndConference: () => void;
  onTransferCall: (callId: string, target: TransferTarget, transferType: TransferType) => void;
  onToggleConferenceRecording?: () => void;
}

const channelLabels: Record<CallChannel, string> = { webrtc: 'WebRTC', wavoip: 'WhatsApp', sip: 'SIP' };

export function ActiveCallsIndicator({
  activeCalls, activeCallId, conference, onSwitchCall, onEndCall, onToggleHold,
  onStartConference, onAddToConference, onRemoveFromConference, onEndConference, onTransferCall, onToggleConferenceRecording
}: ActiveCallsIndicatorProps) {
  const holdReminder = useHoldReminder(activeCalls);
  const [selectedForConference, setSelectedForConference] = useState<string[]>([]);
  const [isSelectingForConference, setIsSelectingForConference] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferCallId, setTransferCallId] = useState<string | null>(null);

  if (activeCalls.length === 0) return null;

  const transferCall = activeCalls.find(c => c.id === transferCallId);
  const callsNotInConference = activeCalls.filter(c => !c.isInConference);
  const callsInConference = activeCalls.filter(c => c.isInConference);
  const canStartConference = callsNotInConference.length >= 2 && !conference;

  const handleStartConference = () => {
    if (selectedForConference.length >= 2) {
      onStartConference(selectedForConference);
      setSelectedForConference([]);
      setIsSelectingForConference(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2 relative", activeCalls.length > 1 && "animate-pulse")}>
          <Users className="h-4 w-4" />
          <span className="font-medium">{activeCalls.length} chamada{activeCalls.length > 1 ? 's' : ''}</span>
          {activeCalls.some(c => c.isOnHold) && <Badge variant="secondary" className="ml-1 text-xs px-1">Em espera</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-2" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-medium">Chamadas Ativas</span>
            <div className="flex items-center gap-2">
              {holdReminder.callsOnHold.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-7 w-7", holdReminder.isEnabled ? "text-primary" : "text-muted-foreground")}
                      onClick={(e) => { e.stopPropagation(); holdReminder.initAudio(); holdReminder.toggleReminder(); }}>
                      {holdReminder.isEnabled ? <Bell className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{holdReminder.isEnabled ? 'Desativar lembrete sonoro' : 'Ativar lembrete sonoro'}</TooltipContent>
                </Tooltip>
              )}
              <Badge variant="outline">{activeCalls.length}/3</Badge>
            </div>
          </div>

          <HoldReminderSettings {...holdReminder} />

          {canStartConference && !isSelectingForConference && (
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setIsSelectingForConference(true)}>
              <Merge className="h-4 w-4" />Iniciar Conferência
            </Button>
          )}

          {isSelectingForConference && (
            <div className="p-2 bg-primary/5 border border-primary/20 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">Selecione chamadas para mesclar:</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedForConference([]); setIsSelectingForConference(false); }}><X className="h-3 w-3" /></Button>
              </div>
              <Button variant="default" size="sm" className="w-full gap-1" disabled={selectedForConference.length < 2} onClick={handleStartConference}>
                <Merge className="h-3 w-3" />Mesclar ({selectedForConference.length})
              </Button>
            </div>
          )}

          {conference && (
            <ConferenceSection conference={conference} callsInConference={callsInConference} callsNotInConference={callsNotInConference}
              onRemoveFromConference={onRemoveFromConference} onAddToConference={onAddToConference}
              onEndConference={onEndConference} onToggleConferenceRecording={onToggleConferenceRecording} />
          )}

          {activeCalls.map((call) => (
            <div key={call.id} className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors",
              call.id === activeCallId ? "bg-primary/10 border-primary/30" : "bg-muted/50 hover:bg-muted",
              call.isOnHold && "opacity-60", call.isInConference && "border-success/30 bg-success/5")}>
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => !isSelectingForConference && onSwitchCall(call.id)}>
                {isSelectingForConference && !call.isInConference ? (
                  <Checkbox checked={selectedForConference.includes(call.id)} onCheckedChange={() => setSelectedForConference(prev => prev.includes(call.id) ? prev.filter(id => id !== call.id) : [...prev, call.id])} onClick={(e) => e.stopPropagation()} />
                ) : (
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white", call.isInConference ? "bg-success" : call.isOnHold ? "bg-warning" : "bg-success")}>
                    {call.isInConference ? <Users className="h-4 w-4" /> : call.isOnHold ? <Pause className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{call.contactName || call.phoneNumber || 'Chamada'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{channelLabels[call.channel]}</span><span>•</span>
                    <span className="font-mono">{formatDuration(call.duration)}</span>
                    {call.totalHoldTime > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild><span className="flex items-center gap-0.5 text-warning cursor-help"><Clock className="h-3 w-3" /><span className="font-mono">{formatDuration(call.totalHoldTime)}</span></span></TooltipTrigger>
                        <TooltipContent><div className="text-xs"><p>Tempo em espera: {formatDuration(call.totalHoldTime)}</p><p className="text-muted-foreground">Em espera {call.holdCount}x</p></div></TooltipContent>
                      </Tooltip>
                    )}
                    {call.isInConference && <><span>•</span><Badge variant="outline" className="text-[10px] px-1 py-0">Conferência</Badge></>}
                  </div>
                </div>
              </div>
              {!isSelectingForConference && !call.isInConference && (
                <div className="flex items-center gap-1">
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setTransferCallId(call.id); setTransferDialogOpen(true); }} disabled={call.isTransferring}><PhoneForwarded className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Transferir</TooltipContent></Tooltip>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onToggleHold(call.id); }}>{call.isOnHold ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onEndCall(call.id); }}><PhoneOff className="h-3.5 w-3.5" /></Button>
                </div>
              )}
              {call.isTransferring && <Badge variant="outline" className="text-xs animate-pulse">Transferindo...</Badge>}
            </div>
          ))}
        </div>
      </PopoverContent>
      <TransferCallDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen} callId={transferCallId || ''} callerName={transferCall?.contactName || transferCall?.phoneNumber} onTransfer={onTransferCall} />
    </Popover>
  );
}
