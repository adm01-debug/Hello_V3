import { useMemo, useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, RefreshCw, ArrowRight, Radar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useVoipRecommendationInsights, type InsightsPeriod } from '@/hooks/useVoipRecommendationInsights';
import { isProactiveEnabled, setProactiveEnabled } from '@/lib/voipProactiveSnapshot';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORY_LABEL: Record<string, string> = {
  capacity: 'Capacidade',
  quality: 'Qualidade',
  infra: 'Infraestrutura',
  process: 'Processo',
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  info: 'bg-primary/10 text-primary border-primary/30',
};

const DOW_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  period?: InsightsPeriod;
}

export function RecommendationInsightsCard({ period = 'week' }: Props) {
  const { data, isLoading, error } = useVoipRecommendationInsights(period);
  const [proactive, setProactive] = useState<boolean>(() => isProactiveEnabled());

  const handleToggleProactive = (checked: boolean) => {
    setProactive(checked);
    setProactiveEnabled(checked);
    toast.info(checked
      ? 'Checagem proativa diária: ON'
      : 'Checagem proativa: OFF');
  };

  const heatmapMax = useMemo(() => {
    if (!data?.heatmap?.length) return 0;
    return data.heatmap.reduce((m, c) => Math.max(m, c.count), 0);
  }, [data]);

  const heatmapByDow = useMemo(() => {
    const grid: Record<number, Array<{ hour: number; count: number }>> = {};
    for (let d = 0; d < 7; d++) grid[d] = [];
    (data?.heatmap ?? []).forEach(c => grid[c.dow]?.push({ hour: c.hour, count: c.count }));
    Object.values(grid).forEach(row => row.sort((a, b) => a.hour - b.hour));
    return grid;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Insights de Recomendações</CardTitle>
          <CardDescription>Aprendendo com o histórico…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Insights indisponíveis
          </CardTitle>
          <CardDescription>Falha ao calcular insights de efetividade.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const eff = data.effectivenessPct;
  const effColor = eff === null
    ? 'text-muted-foreground'
    : eff >= 70 ? 'text-success'
    : eff >= 40 ? 'text-warning'
    : 'text-destructive';

  const openHistory = () => {
    const trigger = document.querySelector<HTMLButtonElement>('[data-rec-history-trigger]');
    trigger?.click();
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> Insights de Recomendações
          </CardTitle>
          <CardDescription>
            Aprendizado contínuo: efetividade, padrões temporais e recorrências ({period === 'week' ? '7 dias' : '30 dias'})
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch id="proactive-check" checked={proactive} onCheckedChange={handleToggleProactive} />
          <Label htmlFor="proactive-check" className="text-xs flex items-center gap-1 cursor-pointer">
            <Radar className="h-3.5 w-3.5 text-primary" /> Checagem proativa
          </Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPIs */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> Efetividade
            </div>
            <div className={cn('text-3xl font-mono font-bold', effColor)}>
              {eff === null ? '—' : `${eff}%`}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {data.effectivenessSampleSize > 0
                ? `${data.effectivenessSampleSize} ações analisadas (MOS pré/pós 2h)`
                : 'Sem amostras suficientes ainda'}
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <RefreshCw className="h-3.5 w-3.5" /> Recorrências
            </div>
            <div className="text-3xl font-mono font-bold text-warning">
              {data.recurringCategories.length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Categorias com &gt;3 incidências
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Pendentes (snoozed)
            </div>
            <div className="text-3xl font-mono font-bold text-primary">
              {data.pendingSnoozed}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Aguardando reabertura ou ação
            </div>
          </div>
        </div>

        {/* Top problemáticas */}
        {data.topProblematic.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Categorias críticas não resolvidas
            </div>
            <div className="flex flex-col gap-2">
              {data.topProblematic.map((p) => (
                <div key={p.category} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={cn('text-[10px] uppercase shrink-0', SEVERITY_STYLES[p.severity])}>
                      {p.severity}
                    </Badge>
                    <span className="text-sm font-medium truncate">{CATEGORY_LABEL[p.category] ?? p.category}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{p.unresolved} sem ação</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heatmap */}
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Padrão temporal (dia × hora UTC)
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex items-center gap-1 mb-1 pl-10">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="w-3 text-[8px] text-muted-foreground text-center font-mono">
                    {h % 6 === 0 ? h : ''}
                  </div>
                ))}
              </div>
              {Array.from({ length: 7 }).map((_, dow) => (
                <div key={dow} className="flex items-center gap-1 mb-0.5">
                  <div className="w-9 text-[10px] text-muted-foreground font-mono shrink-0">{DOW_LABEL[dow]}</div>
                  {(heatmapByDow[dow] ?? []).map(({ hour, count }) => {
                    const intensity = heatmapMax === 0 ? 0 : count / heatmapMax;
                    return (
                      <div
                        key={`${dow}-${hour}`}
                        title={`${DOW_LABEL[dow]} ${hour}h: ${count} ação(ões)`}
                        className="w-3 h-3 rounded-sm border border-border/30 transition-colors"
                        style={{
                          backgroundColor: count === 0
                            ? 'hsl(var(--muted) / 0.2)'
                            : `hsl(var(--primary) / ${0.2 + intensity * 0.8})`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={openHistory}
          className="w-full text-xs text-primary hover:text-primary-glow transition-colors flex items-center justify-center gap-1.5 py-2 border-t border-border/40"
        >
          Ver histórico completo de ações <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardContent>
    </Card>
  );
}
