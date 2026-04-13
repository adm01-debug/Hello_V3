import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle, CheckCircle, Clock, Ban, Activity, TrendingUp, RefreshCw, Search, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRateLimitData } from '@/hooks/useRateLimitData';

export default function RateLimitDashboard() {
  usePageTitle('Rate Limit');

  const {
    isLoading, refreshing, alerts, settings, searchTerm, setSearchTerm,
    stats, chartData, filteredLogs,
    refresh, resolveAlert, unblockIP, cleanOldLogs,
  } = useRateLimitData();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" />Rate Limiting Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitore e gerencie limites de requisições</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={cleanOldLogs}><Trash2 className="mr-2 h-4 w-4" />Limpar Antigos</Button>
          <Button onClick={refresh} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Atualizar</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total de Requests</p><p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p></div><Activity className="h-8 w-8 text-primary opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">IPs Bloqueados</p><p className="text-2xl font-bold">{stats.blockedIPs}</p></div><Ban className="h-8 w-8 text-destructive opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Alertas Ativos</p><p className="text-2xl font-bold">{stats.activeAlerts}</p></div><AlertTriangle className="h-8 w-8 text-warning opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Requests (24h)</p><p className="text-2xl font-bold">{stats.requestsLast24h.toLocaleString()}</p></div><TrendingUp className="h-8 w-8 text-success opacity-50" /></div></CardContent></Card>
      </div>

      {stats.activeAlerts > 0 && (
        <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{stats.activeAlerts} alerta(s) ativo(s) requerem atenção</AlertDescription></Alert>
      )}

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle>Atividade de Requests</CardTitle><CardDescription>Últimas 24 horas</CardDescription></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs de Requests</TabsTrigger>
          <TabsTrigger value="alerts">Alertas{stats.activeAlerts > 0 && <Badge variant="destructive" className="ml-2">{stats.activeAlerts}</Badge>}</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Logs de Rate Limit</CardTitle><CardDescription>Histórico de requisições e bloqueios</CardDescription></div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar IP ou endpoint..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>IP</TableHead><TableHead>Endpoint</TableHead><TableHead>Requests</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                      <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                      <TableCell>{log.request_count}</TableCell>
                      <TableCell><Badge variant={log.is_blocked ? 'destructive' : 'default'}>{log.is_blocked ? 'Bloqueado' : 'OK'}</Badge></TableCell>
                      <TableCell>{new Date(log.created_at ?? 0).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{log.is_blocked && <Button variant="ghost" size="sm" onClick={() => unblockIP(log.ip_address)}>Desbloquear</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Alertas de Rate Limit</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>IP</TableHead><TableHead>Endpoint</TableHead><TableHead>Requests</TableHead><TableHead>Limite</TableHead><TableHead>Severidade</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono text-sm">{alert.ip_address}</TableCell>
                      <TableCell className="font-mono text-sm">{alert.endpoint}</TableCell>
                      <TableCell>{alert.request_count}</TableCell>
                      <TableCell>{alert.threshold}</TableCell>
                      <TableCell><Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>{alert.severity}</Badge></TableCell>
                      <TableCell><Badge variant={alert.is_resolved ? 'default' : 'outline'}>{alert.is_resolved ? <><CheckCircle className="mr-1 h-3 w-3" />Resolvido</> : <><Clock className="mr-1 h-3 w-3" />Pendente</>}</Badge></TableCell>
                      <TableCell className="text-right">{!alert.is_resolved && <Button variant="ghost" size="sm" onClick={() => resolveAlert(alert.id)}>Resolver</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Configurações de Rate Limit</CardTitle><CardDescription>Limites por endpoint</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Padrão do Endpoint</TableHead><TableHead>Max Requests</TableHead><TableHead>Janela (s)</TableHead><TableHead>Bloqueio (s)</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {settings.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.endpoint_pattern}</TableCell>
                      <TableCell>{s.max_requests}</TableCell>
                      <TableCell>{s.window_seconds}</TableCell>
                      <TableCell>{s.block_duration_seconds}</TableCell>
                      <TableCell><Badge variant={s.is_enabled ? 'default' : 'secondary'}>{s.is_enabled ? 'Ativo' : 'Inativo'}</Badge></TableCell>
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
