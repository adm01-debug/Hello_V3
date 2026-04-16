import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Headphones, User, Clock, AlertTriangle, CheckCircle2, ArrowUpDown } from 'lucide-react';
import type { TalkRatioResult } from '@/hooks/useTalkRatio';
import { cn } from '@/lib/utils';

interface Props { data: TalkRatioResult | null; loading?: boolean; }

function fmt(s: number) {
  const m = Math.floor(s / 60); const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function TalkRatioChart({ data, loading }: Props) {
  if (loading) return <Card className="p-6 animate-pulse h-64" />;
  if (!data) return null;

  const agentPct = Math.round(data.agentTalkRatio * 100);
  const customerPct = Math.round(data.customerTalkRatio * 100);
  const silencePct = Math.round(data.silenceRatio * 100);

  const statusLabel = data.benchmark.status === 'optimal' ? 'Equilibrado'
    : data.benchmark.status === 'agent_high' ? 'Agente fala demais'
    : 'Agente fala pouco';
  const statusColor = data.benchmark.status === 'optimal' ? 'text-success' : 'text-warning';
  const StatusIcon = data.benchmark.status === 'optimal' ? CheckCircle2 : AlertTriangle;

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Talk Ratio</h3>
        <Badge variant="outline" className={cn('gap-1', statusColor)}>
          <StatusIcon className="h-3 w-3" />
          {statusLabel}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="flex items-center gap-2"><Headphones className="h-4 w-4 text-primary" /> Agente</span>
            <span className="font-medium">{agentPct}% • {fmt(data.agentTalkSeconds)}</span>
          </div>
          <Progress value={agentPct} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="flex items-center gap-2"><User className="h-4 w-4 text-warning" /> Cliente</span>
            <span className="font-medium">{customerPct}% • {fmt(data.customerTalkSeconds)}</span>
          </div>
          <Progress value={customerPct} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Silêncio</span>
            <span className="text-muted-foreground">{silencePct}% • {fmt(data.silenceSeconds)}</span>
          </div>
          <Progress value={silencePct} className="h-2 opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Maior monólogo agente</div>
          <div className="text-lg font-bold text-primary">{fmt(data.longestAgentMonologueSeconds)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Maior monólogo cliente</div>
          <div className="text-lg font-bold text-warning">{fmt(data.longestCustomerMonologueSeconds)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><ArrowUpDown className="h-3 w-3" />Interrupções</div>
          <div className="text-lg font-bold">{data.interruptions}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Ideal: agente fala entre 40% e 60%. {data.benchmark.status !== 'optimal' && 'Ajuste para escutar mais o cliente ou conduzir melhor a conversa.'}
      </p>
    </Card>
  );
}
