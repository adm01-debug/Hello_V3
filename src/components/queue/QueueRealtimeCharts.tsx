import { Activity, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RealtimeData, QueueMetrics } from '@/hooks/useQueueMetrics';

interface Props {
  realtimeData: RealtimeData[];
  metrics: QueueMetrics;
}

export function QueueRealtimeCharts({ realtimeData }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Chamadas em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="activeCalls" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Ativas" />
              <Area type="monotone" dataKey="waitingCalls" stroke="hsl(var(--warning))" fill="hsl(var(--warning) / 0.2)" name="Em espera" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" />Nível de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="serviceLevel" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Nível de Serviço %" />
              <Line type="monotone" dataKey={() => 80} stroke="hsl(var(--warning))" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Meta (80%)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
