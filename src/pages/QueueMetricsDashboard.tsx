import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Users, 
  Clock, 
  PhoneOff, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Phone,
  Pause,
  CheckCircle,
  AlertTriangle,
  Gauge
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';

interface QueueMetrics {
  activeCalls: number;
  waitingCalls: number;
  avgWaitTime: number;
  avgHandleTime: number;
  abandonmentRate: number;
  serviceLevel: number;
  agentsAvailable: number;
  agentsBusy: number;
  agentsOnBreak: number;
}

interface RealtimeData {
  timestamp: string;
  activeCalls: number;
  waitingCalls: number;
  avgWaitTime: number;
  serviceLevel: number;
}

const QueueMetricsDashboard = () => {
  const [metrics, setMetrics] = useState<QueueMetrics>({
    activeCalls: 0,
    waitingCalls: 0,
    avgWaitTime: 0,
    avgHandleTime: 0,
    abandonmentRate: 0,
    serviceLevel: 0,
    agentsAvailable: 0,
    agentsBusy: 0,
    agentsOnBreak: 0,
  });
  const [realtimeData, setRealtimeData] = useState<RealtimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      // Fetch active calls
      const { data: activeCalls } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('status', 'active');

      // Fetch agents
      const { data: agents } = await supabase
        .from('agents')
        .select('status');

      // Fetch recent completed calls for metrics
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentCalls } = await supabase
        .from('call_sessions')
        .select('duration_seconds, hold_time_seconds, status')
        .gte('created_at', oneHourAgo);

      // Calculate metrics
      const active = activeCalls?.length || 0;
      const waiting = activeCalls?.filter(c => c.status === 'waiting')?.length || 0;
      
      const agentsAvailable = agents?.filter(a => a.status === 'available')?.length || 0;
      const agentsBusy = agents?.filter(a => a.status === 'busy' || a.status === 'on_call')?.length || 0;
      const agentsOnBreak = agents?.filter(a => a.status === 'break' || a.status === 'away')?.length || 0;

      // Calculate averages from recent calls
      const completedCalls = recentCalls?.filter(c => c.status === 'completed') || [];
      const avgHandleTime = completedCalls.length > 0
        ? completedCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / completedCalls.length
        : 0;
      
      const avgWaitTime = completedCalls.length > 0
        ? completedCalls.reduce((acc, c) => acc + (c.hold_time_seconds || 0), 0) / completedCalls.length
        : 0;

      // Abandonment rate simulation
      const abandonedCalls = recentCalls?.filter(c => c.status === 'abandoned')?.length || 0;
      const totalCalls = (recentCalls?.length || 0) + abandonedCalls;
      const abandonmentRate = totalCalls > 0 ? (abandonedCalls / totalCalls) * 100 : 0;

      // Service level (calls answered within 20 seconds)
      const answeredQuickly = completedCalls.filter(c => (c.hold_time_seconds || 0) < 20).length;
      const serviceLevel = completedCalls.length > 0
        ? (answeredQuickly / completedCalls.length) * 100
        : 100;

      const newMetrics = {
        activeCalls: active,
        waitingCalls: waiting,
        avgWaitTime: Math.round(avgWaitTime),
        avgHandleTime: Math.round(avgHandleTime),
        abandonmentRate: Math.round(abandonmentRate * 10) / 10,
        serviceLevel: Math.round(serviceLevel),
        agentsAvailable,
        agentsBusy,
        agentsOnBreak,
      };

      setMetrics(newMetrics);
      setLastUpdate(new Date());

      // Add to realtime data
      const newDataPoint: RealtimeData = {
        timestamp: format(new Date(), 'HH:mm:ss'),
        activeCalls: active,
        waitingCalls: waiting,
        avgWaitTime: Math.round(avgWaitTime),
        serviceLevel: Math.round(serviceLevel),
      };

      setRealtimeData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep last 20 data points
        return updated.slice(-20);
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);

    // Subscribe to real-time updates
    const channel = supabase
      .channel('queue-metrics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_sessions' },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agents' },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  const getServiceLevelColor = (level: number) => {
    if (level >= 80) return 'text-success';
    if (level >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getAbandonmentColor = (rate: number) => {
    if (rate <= 5) return 'text-success';
    if (rate <= 10) return 'text-warning';
    return 'text-destructive';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Métricas</h1>
          <p className="text-muted-foreground mt-1">Monitoramento em tempo real da fila</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Última atualização: {format(lastUpdate, 'HH:mm:ss')}
          </div>
          <Button onClick={fetchMetrics} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chamadas Ativas</p>
                <p className="text-4xl font-bold text-primary">{metrics.activeCalls}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <Phone className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {metrics.waitingCalls > 0 && (
                <Badge variant="outline" className="border-warning text-warning">
                  <Pause className="h-3 w-3 mr-1" />
                  {metrics.waitingCalls} em espera
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nível de Serviço</p>
                <p className={`text-4xl font-bold ${getServiceLevelColor(metrics.serviceLevel)}`}>
                  {metrics.serviceLevel}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${metrics.serviceLevel >= 80 ? 'bg-success/20' : 'bg-warning/20'}`}>
                <Gauge className={`h-8 w-8 ${getServiceLevelColor(metrics.serviceLevel)}`} />
              </div>
            </div>
            <Progress value={metrics.serviceLevel} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Abandono</p>
                <p className={`text-4xl font-bold ${getAbandonmentColor(metrics.abandonmentRate)}`}>
                  {metrics.abandonmentRate}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${metrics.abandonmentRate <= 5 ? 'bg-success/20' : 'bg-destructive/20'}`}>
                <PhoneOff className={`h-8 w-8 ${getAbandonmentColor(metrics.abandonmentRate)}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              {metrics.abandonmentRate <= 5 ? (
                <>
                  <TrendingDown className="h-4 w-4 text-success" />
                  Dentro da meta
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  Acima da meta
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio de Espera</p>
                <p className="text-4xl font-bold">{formatTime(metrics.avgWaitTime)}</p>
              </div>
              <div className="p-3 rounded-full bg-accent/20">
                <Clock className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              TMA: {formatTime(metrics.avgHandleTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Status dos Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <p className="font-medium">Disponíveis</p>
                  <p className="text-sm text-muted-foreground">Prontos para atender</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-success">{metrics.agentsAvailable}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Em Atendimento</p>
                  <p className="text-sm text-muted-foreground">Em chamada ativa</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-primary">{metrics.agentsBusy}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-3">
                <Pause className="h-6 w-6 text-warning" />
                <div>
                  <p className="font-medium">Em Pausa</p>
                  <p className="text-sm text-muted-foreground">Intervalos e reuniões</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-warning">{metrics.agentsOnBreak}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Chamadas em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={realtimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="activeCalls" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)"
                  name="Ativas"
                />
                <Area 
                  type="monotone" 
                  dataKey="waitingCalls" 
                  stroke="hsl(var(--warning))" 
                  fill="hsl(var(--warning) / 0.2)"
                  name="Em espera"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Nível de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={realtimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="serviceLevel" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={false}
                  name="Nível de Serviço %"
                />
                {/* Reference line at 80% */}
                <Line 
                  type="monotone" 
                  dataKey={() => 80}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  name="Meta (80%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Summary */}
      {(metrics.serviceLevel < 80 || metrics.abandonmentRate > 10 || metrics.waitingCalls > 5) && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.serviceLevel < 80 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="border-warning text-warning">SL</Badge>
                  Nível de serviço abaixo de 80%
                </div>
              )}
              {metrics.abandonmentRate > 10 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive">ABN</Badge>
                  Taxa de abandono acima de 10%
                </div>
              )}
              {metrics.waitingCalls > 5 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="border-warning text-warning">FILA</Badge>
                  Mais de 5 chamadas em espera
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QueueMetricsDashboard;
