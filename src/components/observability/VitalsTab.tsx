import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { vitalConfig, ratingColors } from './constants';
import type { WebVitalMetric } from '@/lib/web-vitals';

interface Props {
  vitals: Record<string, WebVitalMetric | undefined>;
}

export function VitalsTab({ vitals }: Props) {
  const vitalChartData = Object.entries(vitals)
    .filter(([, m]) => m)
    .map(([name, m]) => ({
      name,
      value: Math.round((m!.value + Number.EPSILON) * 100) / 100,
      rating: m!.rating,
    }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(vitalConfig).map(([key, config]) => {
          const metric = vitals[key];
          return (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {config.icon}
                    {key}
                  </div>
                  {metric && (
                    <Badge variant="outline" className={ratingColors[metric.rating]}>
                      {metric.rating === 'good' ? 'Bom' : metric.rating === 'needs-improvement' ? 'Médio' : 'Ruim'}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">
                  {metric ? `${Math.round(metric.value * 100) / 100}${config.unit}` : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {vitalChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vitalChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
