import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldAlert, Activity, Eye, Download, Users, FileText, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Bell, Clock, LogIn } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSecurityMonitoringData } from '@/hooks/useSecurityMonitoringData';

const SecurityMonitoring = () => {
  usePageTitle('Monitoramento de Segurança');

  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { recentLogs, alerts, stats, isLive, setIsLive, fetchData, resolveAlert } = useSecurityMonitoringData(profile?.email);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) navigate('/unauthorized');
  }, [profile, loading, navigate]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view': return <Eye className="h-4 w-4 text-info" />;
      case 'export': return <Download className="h-4 w-4 text-warning" />;
      case 'download': return <Download className="h-4 w-4 text-success" />;
      case 'create': return <FileText className="h-4 w-4 text-success" />;
      case 'update': return <FileText className="h-4 w-4 text-info" />;
      case 'delete': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      case 'info': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="h-8 w-8 text-primary" />Monitoramento de Segurança</h1>
          <p className="text-muted-foreground mt-1">Monitoramento em tempo real de acessos e alertas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant={isLive ? "default" : "outline"} onClick={() => setIsLive(!isLive)} className="gap-2">
            {isLive ? (<><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span></span>Ao Vivo</>) : (<><Activity className="h-4 w-4" />Pausado</>)}
          </Button>
          <Button variant="outline" onClick={fetchData} className="gap-2"><RefreshCw className="h-4 w-4" />Atualizar</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        {[
          { label: 'Eventos (24h)', val: stats.totalEvents, icon: Activity },
          { label: 'Visualizações', val: stats.viewEvents, icon: Eye },
          { label: 'Exportações', val: stats.exportEvents, icon: Download },
          { label: 'Downloads', val: stats.downloadEvents, icon: Download },
          { label: 'Usuários Ativos', val: stats.uniqueUsers, icon: Users },
        ].map(s => (
          <Card key={s.label}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{s.label}</CardTitle><s.icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{s.val}</div></CardContent></Card>
        ))}
        <Card className={stats.criticalAlerts > 0 ? 'border-destructive/50 bg-destructive/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle><ShieldAlert className={`h-4 w-4 ${stats.criticalAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'}`} /></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${stats.criticalAlerts > 0 ? 'text-destructive' : ''}`}>{stats.criticalAlerts}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2"><Activity className="h-4 w-4" />Atividade</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2"><Bell className="h-4 w-4" />Alertas{stats.criticalAlerts > 0 && <Badge variant="destructive" className="ml-1">{stats.criticalAlerts}</Badge>}</TabsTrigger>
          <TabsTrigger value="login-attempts" className="gap-2"><LogIn className="h-4 w-4" />Login</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Eventos Recentes{isLive && <span className="relative flex h-2 w-2 ml-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span></span>}</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {recentLogs.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhum evento registrado</div> : recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">{getActionIcon(log.action)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-medium truncate">{log.user_email || 'Sistema'}</span><Badge variant="outline" className="text-xs">{log.user_role || 'N/A'}</Badge></div>
                        <div className="text-sm text-muted-foreground"><span className="capitalize">{log.action}</span> em <span className="font-mono text-xs bg-muted px-1 rounded">{log.resource_type}</span></div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Alertas de Segurança</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alerts.length === 0 ? <div className="text-center py-8 text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success/50" /><p>Nenhum alerta</p></div> : alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${alert.is_resolved ? 'bg-muted/50 opacity-60' : alert.severity === 'critical' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {alert.is_resolved ? <CheckCircle2 className="h-5 w-5 text-success mt-0.5" /> : alert.severity === 'critical' ? <XCircle className="h-5 w-5 text-destructive mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />}
                          <div>
                            <div className="flex items-center gap-2"><h4 className="font-medium">{alert.title}</h4><Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge></div>
                            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                            {alert.source_user_email && <p className="text-sm mt-2"><span className="text-muted-foreground">Usuário: </span><span className="font-mono">{alert.source_user_email}</span></p>}
                            <p className="text-xs text-muted-foreground mt-2">{format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                            {alert.is_resolved && alert.resolved_by && <p className="text-xs text-green-500 mt-1">Resolvido por {alert.resolved_by}</p>}
                          </div>
                        </div>
                        {!alert.is_resolved && <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>Resolver</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login-attempts"><LoginAttemptsPanel /></TabsContent>
      </Tabs>

      {/* Detection Rules */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Regras de Detecção Ativas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4"><h4 className="font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Acesso Excessivo a Contatos</h4><p className="text-sm text-muted-foreground mt-1">Alerta crítico quando um usuário acessa mais de 50 contatos em 5 minutos</p></div>
            <div className="border rounded-lg p-4"><h4 className="font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Exportação em Massa</h4><p className="text-sm text-muted-foreground mt-1">Alerta crítico quando um usuário realiza mais de 3 exportações em 10 minutos</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function LoginAttemptsPanel() {
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('login_attempts').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  const failedCount = attempts.filter(a => !a.success).length;
  const successCount = attempts.filter(a => a.success).length;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5" />Tentativas de Login</CardTitle><CardDescription>{successCount} sucesso, {failedCount} falhas</CardDescription></CardHeader>
      <CardContent>
        {attempts.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhuma tentativa registrada</div> : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader><TableRow><TableHead>E-mail</TableHead><TableHead>Status</TableHead><TableHead>IP</TableHead><TableHead>User Agent</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
              <TableBody>
                {attempts.map(a => (
                  <TableRow key={a.id} className={!a.success ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-mono text-sm">{a.email}</TableCell>
                    <TableCell>{a.success ? <Badge className="bg-emerald-500/15 text-emerald-600 gap-1"><CheckCircle2 className="h-3 w-3" />Sucesso</Badge> : <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Falha</Badge>}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.ip_address || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{a.user_agent || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default SecurityMonitoring;
