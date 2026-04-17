import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('CapacityForecastChart');

interface ForecastDay {
  date: string;
  predicted_calls: number;
  predicted_peak_concurrent: number;
  confidence_pct: number;
  exceeds_capacity: boolean;
}

interface HistoryDay {
  date: string;
  total_calls: number;
  peak_concurrent: number;
}

interface Payload {
  history: HistoryDay[];
  forecast: ForecastDay[];
  capacity_cap: number;
  exceeds_capacity_in_forecast: boolean;
}

export const CapacityForecastChart = () => {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res, error } = await supabase.functions.invoke('voip-capacity-forecast');
        if (error) throw error;
        setData(res as Payload);
      } catch (err) {
        log.error('Falha ao carregar forecast', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    const past = data.history.map(h => ({
      date: h.date.slice(5),
      historico: h.total_calls,
      previsao: null as number | null,
      pico: h.peak_concurrent,
    }));
    const future = data.forecast.map(f => ({
      date: f.date.slice(5),
      historico: null as number | null,
      previsao: f.predicted_calls,
      pico: f.predicted_peak_concurrent,
    }));
    return [...past, ...future];
  }, [data]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Forecast de Capacidade (7d)
            </CardTitle>
            <CardDescription>
              Histórico vs projeção (média ponderada por dia da semana)
            </CardDescription>
          </div>
          {data?.exceeds_capacity_in_forecast && (
            <Badge variant="outline" className="border-destructive/40 text-destructive">
              <AlertTriangle className="mr-1 h-3 w-3" /> Capacidade excedida prevista
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : !data || chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Histórico insuficiente para projeção (mínimo 7 dias).
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <RTooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8, fontSize: 12,
                  }}
                />
                <ReferenceLine
                  y={data.capacity_cap}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  label={{ value: `Cap ${data.capacity_cap}`, fill: 'hsl(var(--destructive))', fontSize: 10 }}
                />
                <Line
                  type="monotone" dataKey="historico" stroke="hsl(var(--primary))"
                  strokeWidth={2} dot={{ r: 2 }} name="Histórico"
                  connectNulls={false}
                />
                <Line
                  type="monotone" dataKey="previsao" stroke="hsl(var(--primary))"
                  strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Previsão"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {data.forecast.slice(0, 4).map(f => (
                <div key={f.date} className="rounded border border-border/40 p-2">
                  <div className="text-muted-foreground">{f.date.slice(5)}</div>
                  <div className="font-mono font-medium">{f.predicted_calls} chamadas</div>
                  <div className="text-[10px] text-muted-foreground">
                    pico {f.predicted_peak_concurrent} • {f.confidence_pct}% conf
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
