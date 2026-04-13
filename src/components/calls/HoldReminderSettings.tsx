import { Bell, VolumeX, Volume2, AlertTriangle, BellRing, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CallSession } from '@/hooks/useMultiChannelCall';
import { REMINDER_INTERVALS, ALERT_THRESHOLDS, ReminderInterval, HoldAlertThreshold } from '@/hooks/useHoldReminder';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface HoldReminderSettingsProps {
  isEnabled: boolean;
  interval: ReminderInterval;
  alertThreshold: HoldAlertThreshold;
  alertsEnabled: boolean;
  activeAlerts: Array<{ callId: string; callName: string; holdTime: number; severity: string }>;
  browserNotificationsEnabled: boolean;
  callsOnHold: CallSession[];
  toggleReminder: () => void;
  toggleAlerts: () => void;
  changeInterval: (val: ReminderInterval) => void;
  changeAlertThreshold: (val: HoldAlertThreshold) => void;
  clearAlerts: () => void;
  requestBrowserNotifications: () => void;
  initAudio: () => void;
}

export function HoldReminderSettings({
  isEnabled, interval, alertThreshold, alertsEnabled, activeAlerts,
  browserNotificationsEnabled, callsOnHold, toggleReminder, toggleAlerts,
  changeInterval, changeAlertThreshold, clearAlerts, requestBrowserNotifications, initAudio
}: HoldReminderSettingsProps) {
  if (callsOnHold.length === 0) return null;

  return (
    <div className="px-2 py-2 bg-warning/10 border border-warning/30 rounded-md space-y-3">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-warning animate-pulse" />
        <span className="text-xs text-warning-foreground">
          {callsOnHold.length} chamada{callsOnHold.length > 1 ? 's' : ''} em espera
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Lembrete:</span>
        <ToggleGroup type="single" value={interval.toString()} onValueChange={(v) => { if (v) { initAudio(); changeInterval(Number(v) as ReminderInterval); } }} className="gap-1">
          {REMINDER_INTERVALS.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value.toString()} size="sm" className="h-6 px-2 text-xs">{opt.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-5 w-5", alertsEnabled ? "text-destructive" : "text-muted-foreground")}
                onClick={(e) => { e.stopPropagation(); initAudio(); toggleAlerts(); }}>
                {alertsEnabled ? <AlertTriangle className="h-3 w-3" /> : <BellRing className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{alertsEnabled ? 'Desativar alertas de limite' : 'Ativar alertas de limite'}</TooltipContent>
          </Tooltip>
          <span className="text-xs text-muted-foreground">Alerta:</span>
        </div>
        <ToggleGroup type="single" value={alertThreshold.toString()} onValueChange={(v) => { if (v) { initAudio(); changeAlertThreshold(Number(v) as HoldAlertThreshold); } }} className="gap-1" disabled={!alertsEnabled}>
          {ALERT_THRESHOLDS.slice(0, 4).map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value.toString()} size="sm" className="h-6 px-2 text-xs">{opt.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-warning/20">
        <span className="text-xs text-muted-foreground">Notificações do navegador:</span>
        {browserNotificationsEnabled ? (
          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">Ativadas</Badge>
        ) : (
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={(e) => { e.stopPropagation(); requestBrowserNotifications(); }}>Ativar</Button>
        )}
      </div>

      {activeAlerts.length > 0 && (
        <div className="pt-2 border-t border-warning/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-destructive">{activeAlerts.length} alerta{activeAlerts.length > 1 ? 's' : ''} ativo{activeAlerts.length > 1 ? 's' : ''}</span>
            <Button variant="ghost" size="sm" className="h-5 text-xs px-2" onClick={clearAlerts}>Limpar</Button>
          </div>
          {activeAlerts.slice(0, 3).map((alert, idx) => (
            <div key={`${alert.callId}-${idx}`} className={cn("flex items-center gap-2 p-1.5 rounded text-xs", alert.severity === 'critical' ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground")}>
              {alert.severity === 'critical' ? <AlertTriangle className="h-3 w-3 animate-pulse" /> : <Clock className="h-3 w-3" />}
              <span className="truncate flex-1">{alert.callName}</span>
              <span className="font-mono">{formatDuration(alert.holdTime)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
