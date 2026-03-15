import { useState } from 'react';
import { Phone, PhoneOff, Pause, Play, Users, Volume2, VolumeX, Bell, Merge, X, UserPlus, PhoneForwarded, Mic, MicOff, Clock, AlertTriangle, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CallSession, CallChannel, ConferenceCall, TransferTarget, TransferType } from '@/hooks/useMultiChannelCall';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
import { useHoldReminder, REMINDER_INTERVALS, ALERT_THRESHOLDS, ReminderInterval, HoldAlertThreshold } from '@/hooks/useHoldReminder';
import { TransferCallDialog } from './TransferCallDialog';
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';

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

const channelLabels: Record<CallChannel, string> = {
  webrtc: 'WebRTC',
  wavoip: 'WhatsApp',
  sip: 'SIP'
};

export function ActiveCallsIndicator({
  activeCalls,
  activeCallId,
  conference,
  onSwitchCall,
  onEndCall,
  onToggleHold,
  onStartConference,
  onAddToConference,
  onRemoveFromConference,
  onEndConference,
  onTransferCall,
  onToggleConferenceRecording
}: ActiveCallsIndicatorProps) {
  const { 
    isEnabled, 
    interval, 
    alertThreshold,
    alertsEnabled,
    activeAlerts,
    browserNotificationsEnabled,
    toggleReminder, 
    toggleAlerts,
    changeInterval, 
    changeAlertThreshold,
    clearAlerts,
    requestBrowserNotifications,
    callsOnHold, 
    initAudio 
  } = useHoldReminder(activeCalls);
  const [selectedForConference, setSelectedForConference] = useState<string[]>([]);
  const [isSelectingForConference, setIsSelectingForConference] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferCallId, setTransferCallId] = useState<string | null>(null);

  if (activeCalls.length === 0) return null;

  const transferCall = activeCalls.find(c => c.id === transferCallId);

  const handleOpenTransferDialog = (callId: string) => {
    setTransferCallId(callId);
    setTransferDialogOpen(true);
  };

  if (activeCalls.length === 0) return null;

  const handleToggleReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    initAudio();
    toggleReminder();
  };

  const handleIntervalChange = (value: string) => {
    if (value) {
      initAudio();
      changeInterval(Number(value) as ReminderInterval);
    }
  };

  const handleToggleSelectForConference = (callId: string) => {
    setSelectedForConference(prev => 
      prev.includes(callId) 
        ? prev.filter(id => id !== callId)
        : [...prev, callId]
    );
  };

  const handleStartConference = () => {
    if (selectedForConference.length >= 2) {
      onStartConference(selectedForConference);
      setSelectedForConference([]);
      setIsSelectingForConference(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedForConference([]);
    setIsSelectingForConference(false);
  };

  const callsNotInConference = activeCalls.filter(c => !c.isInConference);
  const callsInConference = activeCalls.filter(c => c.isInConference);
  const canStartConference = callsNotInConference.length >= 2 && !conference;

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
      <PopoverContent className="w-96 p-2" align="end">
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
            <div className="px-2 py-2 bg-warning/10 border border-warning/30 rounded-md space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-warning animate-pulse" />
                <span className="text-xs text-warning-foreground">
                  {callsOnHold.length} chamada{callsOnHold.length > 1 ? 's' : ''} em espera
                </span>
              </div>
              
              {/* Reminder interval */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Lembrete:</span>
                <ToggleGroup
                  type="single"
                  value={interval.toString()}
                  onValueChange={handleIntervalChange}
                  className="gap-1"
                >
                  {REMINDER_INTERVALS.map((opt) => (
                    <ToggleGroupItem
                      key={opt.value}
                      value={opt.value.toString()}
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      {opt.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {/* Alert threshold */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-5 w-5",
                          alertsEnabled ? "text-destructive" : "text-muted-foreground"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          initAudio();
                          toggleAlerts();
                        }}
                      >
                        {alertsEnabled ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <BellRing className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {alertsEnabled ? 'Desativar alertas de limite' : 'Ativar alertas de limite'}
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground">Alerta:</span>
                </div>
                <ToggleGroup
                  type="single"
                  value={alertThreshold.toString()}
                  onValueChange={(value) => {
                    if (value) {
                      initAudio();
                      changeAlertThreshold(Number(value) as HoldAlertThreshold);
                    }
                  }}
                  className="gap-1"
                  disabled={!alertsEnabled}
                >
                  {ALERT_THRESHOLDS.slice(0, 4).map((opt) => (
                    <ToggleGroupItem
                      key={opt.value}
                      value={opt.value.toString()}
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      {opt.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {/* Browser notifications toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-warning/20">
                <span className="text-xs text-muted-foreground">Notificações do navegador:</span>
                {browserNotificationsEnabled ? (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                    Ativadas
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestBrowserNotifications();
                    }}
                  >
                    Ativar
                  </Button>
                )}
              </div>

              {/* Active alerts */}
              {activeAlerts.length > 0 && (
                <div className="pt-2 border-t border-warning/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-destructive">
                      {activeAlerts.length} alerta{activeAlerts.length > 1 ? 's' : ''} ativo{activeAlerts.length > 1 ? 's' : ''}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs px-2"
                      onClick={clearAlerts}
                    >
                      Limpar
                    </Button>
                  </div>
                  {activeAlerts.slice(0, 3).map((alert, idx) => (
                    <div 
                      key={`${alert.callId}-${idx}`}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded text-xs",
                        alert.severity === 'critical' 
                          ? "bg-destructive/10 text-destructive" 
                          : "bg-warning/10 text-warning-foreground"
                      )}
                    >
                      {alert.severity === 'critical' ? (
                        <AlertTriangle className="h-3 w-3 animate-pulse" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span className="truncate flex-1">{alert.callName}</span>
                      <span className="font-mono">{formatDuration(alert.holdTime)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conference Controls */}
          {canStartConference && !isSelectingForConference && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setIsSelectingForConference(true)}
            >
              <Merge className="h-4 w-4" />
              Iniciar Conferência
            </Button>
          )}

          {isSelectingForConference && (
            <div className="p-2 bg-primary/5 border border-primary/20 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">Selecione chamadas para mesclar:</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCancelSelection}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={selectedForConference.length < 2}
                  onClick={handleStartConference}
                >
                  <Merge className="h-3 w-3" />
                  Mesclar ({selectedForConference.length})
                </Button>
              </div>
            </div>
          )}

          {/* Active Conference */}
          {conference && (
            <div className="p-3 bg-success/10 border border-success/30 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Conferência Ativa</p>
                    <p className="text-xs text-muted-foreground">
                      {callsInConference.length} participantes • {formatDuration(conference.duration)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={conference.isRecording ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "gap-1",
                          conference.isRecording && "bg-destructive hover:bg-destructive/90"
                        )}
                        onClick={onToggleConferenceRecording}
                      >
                        {conference.isRecording ? (
                          <>
                            <Mic className="h-3 w-3 animate-pulse" />
                            <span className="text-xs">REC</span>
                          </>
                        ) : (
                          <>
                            <MicOff className="h-3 w-3" />
                            <span className="text-xs">Gravar</span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {conference.isRecording ? 'Parar gravação' : 'Iniciar gravação'}
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onEndConference}
                  >
                    Encerrar
                  </Button>
                </div>
              </div>

              {/* Recording Status Banner */}
              {conference.isRecording && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded text-xs">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-destructive font-medium">Gravação automática ativa</span>
                </div>
              )}
              
              <div className="space-y-1">
                {callsInConference.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-2 bg-background/50 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span>{call.contactName || call.phoneNumber || 'Chamada'}</span>
                      {call.isRecording && (
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onRemoveFromConference(call.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {callsNotInConference.length > 0 && (
                <div className="pt-2 border-t border-success/20">
                  <p className="text-xs text-muted-foreground mb-1">Adicionar à conferência:</p>
                  {callsNotInConference.map((call) => (
                    <Button
                      key={call.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 h-8"
                      onClick={() => onAddToConference(call.id)}
                    >
                      <UserPlus className="h-3 w-3" />
                      {call.contactName || call.phoneNumber || 'Chamada'}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Individual Calls */}
          {activeCalls.map((call) => (
            <div
              key={call.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                call.id === activeCallId 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-muted/50 hover:bg-muted",
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
                    checked={selectedForConference.includes(call.id)}
                    onCheckedChange={() => handleToggleSelectForConference(call.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-white",
                    call.isInConference ? "bg-success" : call.isOnHold ? "bg-warning" : "bg-success"
                  )}>
                    {call.isInConference ? (
                      <Users className="h-4 w-4" />
                    ) : call.isOnHold ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {call.contactName || call.phoneNumber || 'Chamada'}
                  </p>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTransferDialog(call.id);
                        }}
                        disabled={call.isTransferring}
                      >
                        <PhoneForwarded className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Transferir</TooltipContent>
                  </Tooltip>
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
              )}

              {call.isTransferring && (
                <Badge variant="outline" className="text-xs animate-pulse">
                  Transferindo...
                </Badge>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>

      <TransferCallDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        callId={transferCallId || ''}
        callerName={transferCall?.contactName || transferCall?.phoneNumber}
        onTransfer={onTransferCall}
      />
    </Popover>
  );
}
