import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQualityMetrics, useTrunkUsageMetrics } from '@/hooks/useQualityMetrics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, ShieldAlert, Zap, Wifi } from 'lucide-react';
import { format } from 'date-fns';
import { SecurityAuditCard } from './SecurityAuditCard';

export function RealtimeQualityDashboard() {
  const { data: quality = [], isLoading: loadingQuality } = useQualityMetrics();
  const { data: usage = [], isLoading: loadingUsage } = useTrunkUsageMetrics();

  const chartData = [...quality].reverse().map(m => ({
    time: format(new Date(m.created_at), 'HH:mm:ss'),
    mos: Number(m.mos_avg),
    jitter: Number(m.jitter_avg_ms),
    loss: Number(m.packet_loss_pct),
  }));

  const avgMos = quality.length > 0 
    ? (quality.reduce((acc, curr) => acc + Number(curr.mos_avg), 0) / quality.length).toFixed(2)
    : '0.00';

  const failoverRate = usage.length > 0
    ? ((usage.filter(u => u.was_failover).length / usage.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-neon border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              MOS Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMos}</div>
            <p className="text-xs text-muted-foreground mt-1">Qualidade de voz (0-5)</p>
            <Progress value={(Number(avgMos) / 5) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-neon border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-warning" />
              Jitter Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quality.length > 0 ? (quality.reduce((acc, curr) => acc + Number(curr.jitter_avg_ms), 0) / quality.length).toFixed(1) : 0}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">Variação de atraso</p>
          </CardContent>
        </Card>

        <Card className="glass-neon border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wifi className="h-4 w-4 text-destructive" />
              Perda de Pacotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quality.length > 0 ? (quality.reduce((acc, curr) => acc + Number(curr.packet_loss_pct), 0) / quality.length).toFixed(2) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Impacto na rede</p>
          </CardContent>
        </Card>

        <Card className="glass-neon border-info/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-info" />
              Taxa de Failover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failoverRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Resiliência de troncos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Qualidade (MOS)</CardTitle>
              <CardDescription>Monitoramento contínuo da experiência do usuário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="mos" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorMos)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <SecurityAuditCard />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latência e Jitter</CardTitle>
            <CardDescription>Métricas de transporte de voz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line type="monotone" dataKey="jitter" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="loss" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Amostras de Qualidade</CardTitle>
            <CardDescription>Detalhes granulares por sessão de chamada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">Agente</th>
                    <th className="px-4 py-3">MOS</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quality.slice(0, 5).map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{m.agent_name}</td>
                      <td className="px-4 py-3 font-mono">{m.mos_avg}</td>
                      <td className="px-4 py-3">
                        <Badge variant={m.quality_label === 'good' ? 'default' : m.quality_label === 'fair' ? 'secondary' : 'destructive'} className="text-[10px]">
                          {m.quality_label === 'good' ? 'EXCELENTE' : m.quality_label === 'fair' ? 'ACEITÁVEL' : 'CRÍTICO'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
