import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCallVolumeData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
 import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
 import { EmptyState } from '@/components/ui/empty-state';

export const CallVolumeChart = memo(function CallVolumeChart() {
   const { data: volumeData, isLoading, isFetching } = useCallVolumeData();
   
   const hasData = volumeData?.some(d => d.incoming > 0 || d.outgoing > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Volume de Chamadas</CardTitle>
      </CardHeader>
       <CardContent className="relative">
         {isLoading && !volumeData ? (
           <div className="flex flex-col gap-4">
             <Skeleton className="h-[250px] w-full rounded-lg" />
             <div className="flex justify-between">
               {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 w-12" />)}
             </div>
           </div>
         ) : !hasData ? (
           <div className="h-[300px] flex items-center justify-center">
             <EmptyState
               iconType="chart"
               title="Sem dados de volume"
               description="Não há chamadas registradas nas últimas 24 horas para exibir no gráfico."
               size="sm"
             />
           </div>
         ) : (
           <div className={`h-[300px] transition-opacity duration-300 ${isFetching ? 'opacity-50' : 'opacity-100'}`} role="img" aria-label="Gráfico de volume de chamadas por hora">
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
