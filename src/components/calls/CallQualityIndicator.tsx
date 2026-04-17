import { useEffect, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { VoipQualityState, QualityLabel } from '@/hooks/useVoipQualityMonitor';

interface Props {
  quality: VoipQualityState;
  notifyOnDegrade?: boolean;
}

const labelMap: Record<QualityLabel, { text: string; color: string; bars: number }> = {
  excellent: { text: 'Excelente', color: 'text-success', bars: 5 },
  good:      { text: 'Boa',       color: 'text-success', bars: 4 },
  fair:      { text: 'Regular',   color: 'text-warning', bars: 3 },
  poor:      { text: 'Ruim',      color: 'text-destructive', bars: 2 },
  unknown:   { text: 'Aguardando', color: 'text-muted-foreground', bars: 0 },
};

export function CallQualityIndicator({ quality, notifyOnDegrade = true }: Props) {
  const lastLabelRef = useRef<QualityLabel>('unknown');

  useEffect(() => {
    if (!notifyOnDegrade) return;
    if (lastLabelRef.current !== 'poor' && quality.label === 'poor' && quality.samplesCount > 3) {
      toast.warning('⚠️ Qualidade da chamada degradada', {
        description: `MOS: ${quality.mosAvg} • Jitter: ${quality.jitterAvgMs}ms • Perda: ${quality.packetLossPct}%`,
      });
    }
    lastLabelRef.current = quality.label;
  }, [quality.label, quality.samplesCount, quality.mosAvg, quality.jitterAvgMs, quality.packetLossPct, notifyOnDegrade]);

  const cfg = labelMap[quality.label];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-default">
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={cn(
                    'w-1 rounded-sm transition-all',
                    i <= cfg.bars ? cfg.color.replace('text-', 'bg-') : 'bg-muted',
                  )}
                  style={{ height: `${i * 20}%` }}
                />
              ))}
            </div>
            <span className={cn('text-xs font-medium', cfg.color)}>{cfg.text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-semibold">Qualidade VoIP</div>
            <div>MOS: <span className="font-mono">{quality.mosAvg ?? '—'} / 5.0</span></div>
            <div>MOS mínimo: <span className="font-mono">{quality.mosMin ?? '—'}</span></div>
            <div>Jitter médio: <span className="font-mono">{quality.jitterAvgMs ?? '—'} ms</span></div>
            <div>RTT médio: <span className="font-mono">{quality.rttAvgMs ?? '—'} ms</span></div>
            <div>Perda de pacotes: <span className="font-mono">{quality.packetLossPct ?? '—'}%</span></div>
            <div className="text-muted-foreground">Amostras: {quality.samplesCount}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
