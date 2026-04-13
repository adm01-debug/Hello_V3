import { useState } from 'react';
import { Phone, Users, Bell, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CallSession, ConferenceCall, TransferTarget, TransferType } from '@/hooks/useMultiChannelCall';
import { useHoldReminder, ReminderInterval, HoldAlertThreshold } from '@/hooks/useHoldReminder';
import { TransferCallDialog } from './TransferCallDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HoldReminderPanel } from './HoldReminderPanel';
import { ConferencePanel, ConferenceSelection } from './ConferencePanel';
import { CallItemRow } from './CallItemRow';

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

export function ActiveCallsIndicator({
  activeCalls, activeCallId, conference,
  onSwitchCall, onEndCall, onToggleHold,
  onStartConference, onAddToConference, onRemoveFromConference, onEndConference,
  onTransferCall, onToggleConferenceRecording,
}: ActiveCallsIndicatorProps) {
  const {
    isEnabled, interval, alertThreshold, alertsEnabled, activeAlerts,
    browserNotificationsEnabled, toggleReminder, toggleAlerts, changeInterval,
    changeAlertThreshold, clearAlerts, requestBrowserNotifications, callsOnHold, initAudio,
  } = useHoldReminder(activeCalls);

  const [selectedForConference, setSelectedForConference] = useState<string[]>([]);
  const [isSelectingForConference, setIsSelectingForConference] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferCallId, setTransferCallId] = useState<string | null>(null);

  if (activeCalls.length === 0) return null;

  const transferCall = activeCalls.find(c => c.id === transferCallId);
  const callsNotInConference = activeCalls.filter(c => !c.isInConference);
  const callsInConference = activeCalls.filter(c => c.isInConference);
  const canStartConference = callsNotInConference.length >= 2 && !conference;

  const handleToggleSelectForConference = (callId: string) => {
    setSelectedForConference(prev => prev.includes(callId) ? prev.filter(id => id !== callId) : [...prev, callId]);
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
              {callsOnHold.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon"
                      className={cn("h-7 w-7", isEnabled ? "text-primary" : "text-muted-foreground")}
                      onClick={(e) => { e.stopPropagation(); initAudio(); toggleReminder(); }}
                    >
                      {isEnabled ? <Bell className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isEnabled ? 'Desativar lembrete sonoro' : 'Ativar lembrete sonoro'}</TooltipContent>
                </Tooltip>
              )}
              <Badge variant="outline">{activeCalls.length}/3</Badge>
            </div>
          </div>

          <HoldReminderPanel
            callsOnHold={callsOnHold} isEnabled={isEnabled} interval={interval}
            alertThreshold={alertThreshold} alertsEnabled={alertsEnabled} activeAlerts={activeAlerts}
            browserNotificationsEnabled={browserNotificationsEnabled}
            onToggleReminder={(e) => { e.stopPropagation(); initAudio(); toggleReminder(); }}
            onIntervalChange={(v) => { if (v) { initAudio(); changeInterval(Number(v) as ReminderInterval); } }}
            onToggleAlerts={toggleAlerts}
            onChangeAlertThreshold={changeAlertThreshold}
            onClearAlerts={clearAlerts}
            onRequestBrowserNotifications={requestBrowserNotifications}
            initAudio={initAudio}
          />

          <ConferenceSelection
            isSelecting={isSelectingForConference} selectedCount={selectedForConference.length}
            canStart={canStartConference}
            onStartSelection={() => setIsSelectingForConference(true)}
            onCancelSelection={() => { setSelectedForConference([]); setIsSelectingForConference(false); }}
            onStartConference={() => {
              if (selectedForConference.length >= 2) {
                onStartConference(selectedForConference);
                setSelectedForConference([]);
                setIsSelectingForConference(false);
              }
            }}
          />

          {conference && (
            <ConferencePanel
              conference={conference} callsInConference={callsInConference} callsNotInConference={callsNotInConference}
              onRemoveFromConference={onRemoveFromConference} onAddToConference={onAddToConference}
              onEndConference={onEndConference} onToggleConferenceRecording={onToggleConferenceRecording}
            />
          )}

          {activeCalls.map((call) => (
            <CallItemRow
              key={call.id} call={call} isActive={call.id === activeCallId}
              isSelectingForConference={isSelectingForConference}
              isSelectedForConference={selectedForConference.includes(call.id)}
              onSwitchCall={onSwitchCall} onToggleHold={onToggleHold} onEndCall={onEndCall}
              onOpenTransferDialog={(id) => { setTransferCallId(id); setTransferDialogOpen(true); }}
              onToggleSelectForConference={handleToggleSelectForConference}
            />
          ))}
        </div>
      </PopoverContent>

      <TransferCallDialog
        open={transferDialogOpen} onOpenChange={setTransferDialogOpen}
        callId={transferCallId || ''}
        callerName={transferCall?.contactName || transferCall?.phoneNumber}
        onTransfer={onTransferCall}
      />
    </Popover>
  );
}
