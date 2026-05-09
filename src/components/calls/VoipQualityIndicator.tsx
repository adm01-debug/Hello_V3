import { useVoipQualityMonitor, type VoipQualityState } from '@/hooks/useVoipQualityMonitor';
import { Activity, Signal, Zap, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VoipQualityIndicatorProps {
  pc: RTCPeerConnection | null;
  callSessionId?: string | null;
}

export function VoipQualityIndicator({ pc, callSessionId }: VoipQualityIndicatorProps) {
  const quality = useVoipQualityMonitor(pc, { callSessionId, persistOnEnd: true });

  if (quality.label === 'unknown') return null;

  const config = {
    excellent: { label: 'Excelente', color: 'text-success', bg: 'bg-success/10', icon: Signal },
    good: { label: 'Boa', color: 'text-info', bg: 'bg-info/10', icon: Signal },
    fair: { label: 'Instável', color: 'text-warning', bg: 'bg-warning/10', icon: Activity },
    poor: { label: 'Crítica', color: 'text-destructive', bg: 'bg-destructive/10', icon: Zap },
    unknown: { label: 'Desconhecida', color: 'text-muted-foreground', bg: 'bg-muted', icon: Activity },
  };

  const cfg = config[quality.label];
  const Icon = cfg.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-medium border animate-in fade-in zoom-in duration-300",
            cfg.bg,
            cfg.color,
            "border-current/20"
          )}>
            <Icon className="h-3 w-3" />
            <span>Qualidade: {cfg.label}</span>
            {quality.mosAvg !== null && (
              <span className="opacity-70">MOS: {quality.mosAvg}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-64 p-3 bg-background/95 backdrop-blur-sm border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-semibold text-xs">Métricas da Voz (VoIP)</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border border-current/20", cfg.bg, cfg.color)}>
                {cfg.label}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-1">
                <p className="text-muted-foreground">MOS (Média)</p>
                <p className="font-mono font-bold">{quality.mosAvg ?? '--'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Jitter (Médio)</p>
                <p className="font-mono font-bold">{quality.jitterAvgMs ?? '--'} ms</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Latência (RTT)</p>
                <p className="font-mono font-bold">{quality.rttAvgMs ?? '--'} ms</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Perda de Pacotes</p>
                <p className={cn("font-mono font-bold", (quality.packetLossPct ?? 0) > 2 ? "text-destructive" : "")}>
                  {quality.packetLossPct ?? '0.00'} %
                </p>
              </div>
            </div>

            {quality.label === 'poor' && (
              <div className="flex items-start gap-2 p-2 bg-destructive/5 text-destructive border border-destructive/10 rounded-sm text-[10px]">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Instabilidade detectada. Verifique sua conexão local ou largura de banda.</span>
              </div>
            )}
            
            <p className="text-[9px] text-muted-foreground italic">
              Amostras coletadas: {quality.samplesCount}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
