import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, PhoneCall, Clock, Shuffle } from 'lucide-react';
import { useTrunkMetrics } from '@/hooks/useTrunkMetrics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

type Period = 1 | 7 | 30;

const PERIOD_LABELS: Record<Period, string> = { 1: '24h', 7: '7 dias', 30: '30 dias' };

export function TrunkMetricsTab() {
  const [days, setDays] = useState<Period>(7);
  const { data, isLoading } = useTrunkMetrics(days);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summary = data?.summary ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daily = data?.daily ?? [];

  // Pivota daily para gráfico: { date, trunkA: 5, trunkB: 3 }
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    const trunkNames = new Set<string>();
    for (const row of daily) {
      trunkNames.add(row.trunk_name);
      const existing = byDate.get(row.date) ?? { date: row.date };
      existing[row.trunk_name] = row.calls;
      byDate.set(row.date, existing);
    }
    return {
      data: Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date))),
      trunks: Array.from(trunkNames),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily]);

  const totals = useMemo(() => ({
    calls: summary.reduce((s, r) => s + r.total_calls, 0),
    minutes: summary.reduce((s, r) => s + r.total_minutes, 0),
    failovers: summary.reduce((s, r) => s + r.failover_calls, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [summary]);

  const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Métricas de Uso</h3>
        </div>
        <div className="flex gap-1">
          {([1, 7, 30] as Period[]).map(p => (
            <Button
              key={p}
              size="sm"
              variant={days === p ? 'default' : 'outline'}
              onClick={() => setDays(p)}
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> Chamadas
                </CardDescription>
                <CardTitle className="text-3xl">{totals.calls}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Minutos consumidos
                </CardDescription>
                <CardTitle className="text-3xl">{totals.minutes}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4" /> Failovers
                </CardDescription>
                <CardTitle className="text-3xl">{totals.failovers}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chamadas por dia</CardTitle>
              <CardDescription>Últimos {PERIOD_LABELS[days]} agrupados por linha</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                      <Legend />
                      {chartData.trunks.map((name, i) => (
                        <Bar key={name} dataKey={name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo por linha</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma chamada registrada no período</p>
              ) : (
                <div className="space-y-2">
                  {summary.map(row => (
                    <div key={row.trunk_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="font-medium">{row.trunk_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.total_calls} chamadas · {row.total_minutes} min
                        </p>
                      </div>
                      {row.failover_calls > 0 && (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1">
                          <Shuffle className="h-3 w-3" />
                          {row.failover_calls} failover{row.failover_calls > 1 ? 's' : ''} ({Math.round(row.failover_rate * 100)}%)
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
