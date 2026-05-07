import { memo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { useCallVolumeData } from '@/hooks/useDashboardData';
 import { Skeleton } from '@/components/ui/skeleton';
 import { TrendingUp } from 'lucide-react';
 import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const CallVolumeChart = memo(function CallVolumeChart() {
  const { data: volumeData, isLoading } = useCallVolumeData();

  return (
    <Card className="card-premium border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/5 text-primary/80">
            <TrendingUp className="h-5 w-5" />
          </div>
          Volume de Tráfego
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] rounded-lg" />
        ) : (
          <div className="h-[300px]" role="img" aria-label="Gráfico de volume de chamadas por hora">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={volumeData || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm text-muted-foreground">
                      {value === 'incoming' ? 'Recebidas' : 'Realizadas'}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="incoming"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncoming)"
                />
                <Area
                  type="monotone"
                  dataKey="outgoing"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOutgoing)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
