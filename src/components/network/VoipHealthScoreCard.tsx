import { useMemo } from 'react';
import { Activity, TrendingDown, TrendingUp, AlertTriangle, Users, Gauge, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { useVoipExecutiveSummary, type ExecutivePeriod } from '@/hooks/useVoipExecutiveSummary';
import { cn } from '@/lib/utils';

interface Props {
  period?: ExecutivePeriod;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-success/15 text-success border-success/30';
  if (score >= 60) return 'bg-warning/15 text-warning border-warning/30';
  return 'bg-destructive/15 text-destructive border-destructive/30';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'SAUDÁVEL';
  if (score >= 60) return 'ATENÇÃO';
  return 'CRÍTICO';
}

export function VoipHealthScoreCard({ period = 'week' }: Props) {
  const { data, isLoading, error } = useVoipExecutiveSummary(period);

  const sparkData = useMemo(() => {
    if (!data) return [];
    // Sparkline derivada do breakdown (4 pilares + score final)
    const b = data.breakdown;
    return [
      { v: b.sla_score },
      { v: b.mos_score },
      { v: b.alerts_score },
      { v: b.capacity_score },
      { v: data.health_score },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Cockpit indisponível
          </CardTitle>
          <CardDescription>Não foi possível carregar o resumo executivo.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const score = data.health_score;
  const delta = data.sla.delta_pct;

  return (
    <TooltipProvider>
      <Card className="glass-card border-primary/30 shadow-elegant overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Health Score VoIP
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Fórmula:</strong> 40% SLA + 30% MOS + 20% Alertas + 10% Capacidade.
                      <br />≥80 saudável • 60-79 atenção • &lt;60 crítico.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardDescription>
              <CardTitle className="flex items-baseline gap-3 mt-1">
                <span className={cn('text-5xl font-mono font-bold tabular-nums', scoreColor(score))}>
                  {score}
                </span>
                <span className="text-muted-foreground text-sm">/ 100</span>
                <Badge variant="outline" className={cn('font-mono text-[10px] uppercase', scoreBadgeClass(score))}>
                  {scoreLabel(score)}
                </Badge>
              </CardTitle>
            </div>
            <div className="w-32 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <YAxis hide domain={[0, 100]} />
                  <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Breakdown 4 pilares */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'SLA', value: data.breakdown.sla_score, icon: Gauge, weight: '40%' },
              { label: 'MOS', value: data.breakdown.mos_score, icon: Activity, weight: '30%' },
              { label: 'Alertas', value: data.breakdown.alerts_score, icon: AlertTriangle, weight: '20%' },
              { label: 'Capacidade', value: data.breakdown.capacity_score, icon: Users, weight: '10%' },
            ].map(({ label, value, icon: Icon, weight }) => (
              <div key={label} className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</span>
                  <span className="font-mono">{weight}</span>
                </div>
                <div className={cn('text-2xl font-mono font-bold tabular-nums', scoreColor(value))}>
                  {Math.round(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Linha de detalhes contextuais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-border/30">
            <div>
              <p className="text-muted-foreground">SLA atual</p>
              <p className="font-mono text-base flex items-center gap-1.5">
                {data.sla.current_pct !== null ? `${data.sla.current_pct}%` : '—'}
                {delta !== null && delta !== 0 && (
                  <span className={cn('text-[10px] flex items-center gap-0.5', delta > 0 ? 'text-success' : 'text-destructive')}>
                    {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(delta).toFixed(1)}pp
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">MOS médio</p>
              <p className="font-mono text-base">{data.mos_avg ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Alertas pendentes</p>
              <p className={cn('font-mono text-base', data.alerts.unacknowledged > 0 && 'text-warning')}>
                {data.alerts.unacknowledged}
                <span className="text-muted-foreground text-xs"> / {data.alerts.total}</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Pico simultâneo</p>
              <p className="font-mono text-base">
                {data.capacity.peak_concurrent}<span className="text-muted-foreground text-xs"> / {data.capacity.cap}</span>
              </p>
            </div>
          </div>

          {/* Top piores agentes */}
          {data.worst_agents.length > 0 && (
            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2">Agentes com pior MOS (24h, mín. 3 chamadas)</p>
              <div className="flex flex-wrap gap-2">
                {data.worst_agents.map((a) => (
                  <Badge key={a.agent_name} variant="outline" className={cn('font-mono text-xs', scoreBadgeClass(normalizeFromMos(a.mos_avg)))}>
                    {a.agent_name} · {a.mos_avg.toFixed(2)} ({a.calls})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function normalizeFromMos(mos: number): number {
  return Math.round(Math.max(0, Math.min(100, ((mos - 1) / 4) * 100)));
}
