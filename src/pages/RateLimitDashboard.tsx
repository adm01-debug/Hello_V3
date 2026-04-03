import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Loader2, Shield, AlertTriangle, CheckCircle, Clock, 
  Ban, Activity, TrendingUp, RefreshCw, Search, Trash2 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RateLimitLog {
  id: string;
  user_id: string | null;
  ip_address: string;
  endpoint: string;
  request_count: number | null;
  is_blocked: boolean | null;
  block_reason: string | null;
  created_at: string | null;
}

interface RateLimitAlert {
  id: string;
  user_id: string | null;
  ip_address: string;
  endpoint: string;
  request_count: number;
  threshold: number;
  severity: string | null;
  is_resolved: boolean | null;
  created_at: string | null;
}

interface RateLimitSetting {
  id: string;
  endpoint_pattern: string;
  max_requests: number | null;
  window_seconds: number | null;
  block_duration_seconds: number | null;
  is_enabled: boolean | null;
}

export default function RateLimitDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<RateLimitLog[]>([]);
  const [alerts, setAlerts] = useState<RateLimitAlert[]>([]);
  const [settings, setSettings] = useState<RateLimitSetting[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    
    // Realtime subscription para alertas
    const channel = supabase
      .channel('rate-limit-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rate_limit_alerts',
      }, (payload) => {
        toast.warning('Novo alerta de rate limit!', {
          description: `IP ${(payload.new as RateLimitAlert).ip_address} excedeu o limite`,
        });
        setAlerts(prev => [payload.new as RateLimitAlert, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const [logsRes, alertsRes, settingsRes] = await Promise.all([
        supabase
          .from('rate_limit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('rate_limit_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('rate_limit_settings')
          .select('*')
          .order('endpoint_pattern'),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (alertsRes.error) throw alertsRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setLogs(logsRes.data || []);
      setAlerts(alertsRes.data || []);
      setSettings(settingsRes.data || []);
    } catch (error) {
      console.error('Error loading rate limit data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dados atualizados');
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('rate_limit_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alerta resolvido');
      await loadData();
    } catch (error) {
      toast.error('Erro ao resolver alerta');
    }
  };

  const unblockIP = async (ipAddress: string) => {
    try {
      const { error } = await supabase
        .from('rate_limit_logs')
        .update({ is_blocked: false })
        .eq('ip_address', ipAddress)
        .eq('is_blocked', true);

      if (error) throw error;

      toast.success(`IP ${ipAddress} desbloqueado`);
      await loadData();
    } catch (error) {
      toast.error('Erro ao desbloquear IP');
    }
  };

  const cleanOldLogs = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { error } = await supabase
        .from('rate_limit_logs')
        .delete()
        .lt('created_at', oneWeekAgo.toISOString());

      if (error) throw error;

      toast.success('Logs antigos removidos');
      await loadData();
    } catch (error) {
      toast.error('Erro ao limpar logs');
    }
  };

  // Stats
  const stats = {
    totalRequests: logs.reduce((acc, log) => acc + (log.request_count ?? 0), 0),
    blockedIPs: new Set(logs.filter(l => l.is_blocked).map(l => l.ip_address)).size,
    activeAlerts: alerts.filter(a => !a.is_resolved).length,
    requestsLast24h: logs.filter(l => 
      new Date(l.created_at ?? 0) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).reduce((acc, log) => acc + (log.request_count ?? 0), 0),
  };

  // Chart data
  const chartData = logs
    .slice(0, 24)
    .reverse()
    .map(log => ({
      time: new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      requests: log.request_count,
      blocked: log.is_blocked ? 1 : 0,
    }));

  const filteredLogs = logs.filter(log =>
    log.ip_address.includes(searchTerm) ||
    log.endpoint.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Rate Limiting Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie limites de requisições
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={cleanOldLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Antigos
          </Button>
          <Button onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Requests</p>
                <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">IPs Bloqueados</p>
                <p className="text-2xl font-bold">{stats.blockedIPs}</p>
              </div>
              <Ban className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                <p className="text-2xl font-bold">{stats.activeAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requests (24h)</p>
                <p className="text-2xl font-bold">{stats.requestsLast24h.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {stats.activeAlerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {stats.activeAlerts} alerta(s) ativo(s) requerem atenção
            </span>
            <Button variant="outline" size="sm" onClick={() => {/* scroll to alerts */}}>
              Ver Alertas
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade de Requests</CardTitle>
          <CardDescription>Últimas 24 horas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs de Requests</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {stats.activeAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.activeAlerts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs de Rate Limit</CardTitle>
                  <CardDescription>Histórico de requisições e bloqueios</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar IP ou endpoint..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                      <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                      <TableCell>{log.request_count}</TableCell>
                      <TableCell>
                        <Badge variant={log.is_blocked ? 'destructive' : 'default'}>
                          {log.is_blocked ? 'Bloqueado' : 'OK'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.is_blocked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unblockIP(log.ip_address)}
                          >
                            Desbloquear
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Rate Limit</CardTitle>
              <CardDescription>Violações de limite detectadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Limite</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono text-sm">{alert.ip_address}</TableCell>
                      <TableCell className="font-mono text-sm">{alert.endpoint}</TableCell>
                      <TableCell>{alert.request_count}</TableCell>
                      <TableCell>{alert.threshold}</TableCell>
                      <TableCell>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.is_resolved ? 'default' : 'outline'}>
                          {alert.is_resolved ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Resolvido
                            </>
                          ) : (
                            <>
                              <Clock className="mr-1 h-3 w-3" />
                              Pendente
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!alert.is_resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Rate Limit</CardTitle>
              <CardDescription>Limites por endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Padrão do Endpoint</TableHead>
                    <TableHead>Max Requests</TableHead>
                    <TableHead>Janela (s)</TableHead>
                    <TableHead>Bloqueio (s)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-mono text-sm">{setting.endpoint_pattern}</TableCell>
                      <TableCell>{setting.max_requests}</TableCell>
                      <TableCell>{setting.window_seconds}</TableCell>
                      <TableCell>{setting.block_duration_seconds}</TableCell>
                      <TableCell>
                        <Badge variant={setting.is_enabled ? 'default' : 'secondary'}>
                          {setting.is_enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
