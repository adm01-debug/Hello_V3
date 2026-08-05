import { Wifi, WifiOff, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { cn } from '@/lib/utils';

export function NetworkStatusBadge() {
  const net = useNetworkMonitor();

  const statusConfig = {
    online: { label: 'Online', icon: Wifi, className: 'bg-success/15 text-success border-success/30' },
    unstable: { label: 'Instável', icon: Activity, className: 'bg-warning/15 text-warning border-warning/30' },
    offline: { label: 'Offline', icon: WifiOff, className: 'bg-destructive/15 text-destructive border-destructive/30' },
    checking: { label: 'Verificando', icon: Activity, className: 'bg-muted text-muted-foreground border-border' },
  } as const;

  const cfg = statusConfig[net.status];
  const Icon = cfg.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('gap-1.5 cursor-default', cfg.className)}>
            <Icon className="h-3 w-3" />
            <span className="text-xs font-medium">{cfg.label}</span>
            {net.latencyMs !== null && (
              <span className="text-xs opacity-70">{net.latencyMs}ms</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-semibold">Status da Rede</div>
            <div>Latência: <span className="font-mono">{net.latencyMs ?? '—'} ms</span></div>
            <div>Tipo: <span className="font-mono">{net.effectiveType ?? '—'}</span></div>
            <div>Downlink: <span className="font-mono">{net.downlinkMbps ?? '—'} Mbps</span></div>
            <div>RTT (browser): <span className="font-mono">{net.rttMs ?? '—'} ms</span></div>
            {net.consecutiveFailures > 0 && (
              <div className="text-destructive">Falhas consecutivas: {net.consecutiveFailures}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
