import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDuration } from '@/lib/utils';
import { Activity, AlertTriangle, Timer, TrendingDown } from 'lucide-react';
import type { SupervisorQueueMetrics } from '@/hooks/useSupervisorPanel';

interface MetricProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tooltip: string;
  tone?: 'default' | 'warning' | 'destructive';
}

function Metric({ label, value, icon, tooltip, tone = 'default' }: MetricProps) {
  const containerCls =
    tone === 'destructive'
      ? 'bg-destructive/10 border-destructive/30'
      : tone === 'warning'
        ? 'bg-warning/10 border-warning/30'
        : 'bg-accent/30';
  const textCls = tone === 'destructive' ? 'text-destructive' : tone === 'warning' ? 'text-warning' : '';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-2.5 rounded-lg border ${containerCls}`}>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <span className={textCls}>{icon}</span>
              <span className="text-xs">{label}</span>
            </div>
            <p className={`text-lg font-bold ${textCls}`}>{value}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent><p>{tooltip}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function QueueMetricsGrid({ metrics }: { metrics: SupervisorQueueMetrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <Metric
        label="Espera Média"
        value={formatDuration(metrics.avgWaitTime)}
        icon={<Timer className="h-3.5 w-3.5" />}
        tooltip="Tempo médio de espera das chamadas hoje"
      />
      <Metric
        label="Abandono"
        value={`${metrics.abandonmentRate}%`}
        icon={<TrendingDown className="h-3.5 w-3.5" />}
        tooltip={`${metrics.totalAbandoned} chamadas abandonadas de ${metrics.totalCompleted + metrics.totalAbandoned} total`}
        tone={metrics.abandonmentRate > 10 ? 'destructive' : 'default'}
      />
      <Metric
        label="Nível Serviço"
        value={`${metrics.serviceLevelPercent}%`}
        icon={<Activity className="h-3.5 w-3.5" />}
        tooltip="Chamadas atendidas em até 30 segundos"
        tone={metrics.serviceLevelPercent < 80 ? 'warning' : 'default'}
      />
      <Metric
        label="Maior Espera"
        value={formatDuration(metrics.longestWait)}
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        tooltip="Maior tempo de espera registrado hoje"
        tone={metrics.longestWait > 120 ? 'destructive' : 'default'}
      />
    </div>
  );
}
