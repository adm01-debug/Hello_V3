import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForecastVolume } from '@/hooks/useForecastVolume';
import { TrendingUp, Clock, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Fragment } from 'react';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const VolumeForecastCard = () => {
  const { data, isLoading } = useForecastVolume();

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>;
  }
  if (!data) return null;

  const { summary, forecast } = data;
  const peak = summary.peak_hour;

  // Heatmap: por dia da semana x hora
  const maxVal = Math.max(...forecast.map(f => f.expected_calls), 1);

  return (
    <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          Previsão de Volume (próximos 7 dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg border bg-accent/30">
            <div className="text-xs text-muted-foreground">Média diária</div>
            <p className="text-xl font-bold">{summary.avg_daily}</p>
          </div>
          <div className="p-2 rounded-lg border bg-accent/30">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Pico</div>
            <p className="text-sm font-bold">{DAYS_PT[peak.day_of_week]} {peak.hour}h</p>
            <p className="text-xs">{peak.expected_calls} chamadas</p>
          </div>
          <div className="p-2 rounded-lg border bg-accent/30">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Hr-agente/sem</div>
            <p className="text-xl font-bold">{summary.total_required_agent_hours}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-[40px_repeat(24,_minmax(14px,_1fr))] gap-px text-[9px]">
            <div></div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-center text-muted-foreground">{h}</div>
            ))}
            {DAYS_PT.map((day, dow) => (
              <Fragment key={dow}>
                <div key={`d-${dow}`} className="text-muted-foreground py-1">{day}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const slot = forecast.find(f => f.day_of_week === dow && f.hour === h);
                  const intensity = slot ? slot.expected_calls / maxVal : 0;
                  return (
                    <div
                      key={`${dow}-${h}`}
                      className="h-4 rounded-sm"
                      style={{ backgroundColor: `hsl(var(--primary) / ${0.05 + intensity * 0.7})` }}
                      title={`${day} ${h}h: ${slot?.expected_calls || 0} chamadas, ${slot?.required_agents || 0} agentes`}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
