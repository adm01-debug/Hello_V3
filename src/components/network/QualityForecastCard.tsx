import { useMemo, useState } from 'react';
import { TrendingUp, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { toast } from 'sonner';
import { useVoipQualityForecastFetch, type ForecastHorizon } from '@/hooks/useVoipQualityForecast';
import { useVoipCapacityRecommendations } from '@/hooks/useVoipCapacityRecommendations';
import { logger } from '@/lib/logger';

const log = logger.create('QualityForecastCard');

const SEV_COLORS: Record<string, string> = {
  critical: 'border-destructive/40 text-destructive bg-destructive/10',
  warning: 'border-warning/40 text-warning bg-warning/10',
  info: 'border-primary/40 text-primary bg-primary/10',
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const QualityForecastCard = () => {
  const [horizon, setHorizon] = useState<ForecastHorizon>(24);
  const { data: forecast, isLoading } = useVoipQualityForecastFetch(horizon);
  const { data: capacity } = useVoipCapacityRecommendations(horizon);

  const chartData = useMemo(() => {
    if (!forecast?.forecast) return [];
    return forecast.forecast
      .filter(p => p.mos_predicted > 0)
      .map(p => ({
        ts: formatTs(p.ts),
        mos: p.mos_predicted,
        upper: p.mos_upper,
        lower: p.mos_lower,
        volume: p.volume_predicted,
        risk: p.is_risk ? p.mos_predicted : null,
      }));
  }, [forecast]);

  const handleApply = (rec: { id: string; title: string }) => {
    log.info('Aplicando recomendação de capacity', { id: rec.id });
    toast.success('Recomendação registrada', {
      description: rec.title,
      icon: <CheckCircle2 className="h-4 w-4" />,
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Forecast Preditivo de Qualidade
            </CardTitle>
            <CardDescription>
              Projeção determinística de MOS/volume com janelas de risco e recomendações de capacity
            </CardDescription>
          </div>
          <ToggleGroup
            type="single"
            value={String(horizon)}
            onValueChange={(v) => v && setHorizon(Number(v) as ForecastHorizon)}
            size="sm"
          >
            <ToggleGroupItem value="24">24h</ToggleGroupItem>
            <ToggleGroupItem value="72">72h</ToggleGroupItem>
            <ToggleGroupItem value="168">7d</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : forecast?.insufficient_data ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Dados históricos insuficientes (mínimo 24 amostras nos últimos 30 dias).
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded border border-border/40 p-2">
                <div className="text-muted-foreground">MOS médio previsto</div>
                <div className="font-mono font-semibold text-base">{forecast?.summary.avg_mos_predicted ?? '—'}</div>
              </div>
              <div className="rounded border border-border/40 p-2">
                <div className="text-muted-foreground">Janelas de risco</div>
                <div className="font-mono font-semibold text-base text-warning">{forecast?.summary.risk_windows ?? 0}</div>
              </div>
              <div className="rounded border border-border/40 p-2">
                <div className="text-muted-foreground">P95 volume hist.</div>
                <div className="font-mono font-semibold text-base">{forecast?.summary.p95_volume_historical ?? 0}</div>
              </div>
              <div className="rounded border border-border/40 p-2">
                <div className="text-muted-foreground">Tendência MOS</div>
                <div className="font-mono font-semibold text-base">
                  {(forecast?.summary.trend_slope_mos ?? 0) >= 0 ? '↑' : '↓'} {forecast?.summary.trend_slope_mos.toFixed(4)}
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="ts" stroke="hsl(var(--muted-foreground))" fontSize={10} interval="preserveStartEnd" />
                <YAxis domain={[1, 5]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <RTooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8, fontSize: 12,
                  }}
                />
                <ReferenceLine y={3.5} stroke="hsl(var(--destructive))" strokeDasharray="5 5"
                  label={{ value: 'Limite SLA', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                <Area type="monotone" dataKey="mos" stroke="hsl(var(--primary))" strokeWidth={2}
                  fill="url(#mosGrad)" name="MOS previsto" />
                <Area type="monotone" dataKey="risk" stroke="hsl(var(--destructive))" strokeWidth={0}
                  fill="hsl(var(--destructive))" fillOpacity={0.5} name="Risco" />
              </AreaChart>
            </ResponsiveContainer>

            {capacity && capacity.recommendations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Recomendações de Capacity</span>
                  <Badge variant="outline" className="text-[10px]">
                    {capacity.confidence}% confiança
                  </Badge>
                </div>
                <div className="space-y-2">
                  {capacity.recommendations.map(rec => (
                    <div
                      key={rec.id}
                      className="flex items-start justify-between gap-3 rounded border border-border/40 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className={SEV_COLORS[rec.severity]}>
                            {rec.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {rec.action_type}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleApply(rec)}>
                        Aplicar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {forecast && forecast.summary.risk_windows === 0 && (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" />
                Sem janelas de risco previstas no horizonte selecionado.
              </div>
            )}

            {forecast && forecast.summary.risk_windows > 0 && (
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="h-3 w-3" />
                {forecast.summary.risk_windows} hora(s) com risco previsto. Revise as recomendações acima.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
