import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, ShieldAlert, Activity, Eye, Download, Users, FileText,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Bell, Clock, LogIn
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { usePageTitle } from '@/hooks/usePageTitle';

const SecurityMonitoring = () => {
  usePageTitle('Monitoramento de Segurança');
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { recentLogs, alerts, stats, isLive, setIsLive, fetchData, resolveAlert } = useSecurityMonitoring(profile?.email);

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

      <div className="grid gap-4 md:grid-cols-6">
        {[
          { label: 'Eventos (24h)', value: stats.totalEvents, icon: Activity },
          { label: 'Visualizações', value: stats.viewEvents, icon: Eye, iconClass: 'text-info' },
          { label: 'Exportações', value: stats.exportEvents, icon: Download, iconClass: 'text-warning' },
          { label: 'Downloads', value: stats.downloadEvents, icon: Download, iconClass: 'text-success' },
          { label: 'Usuários Ativos', value: stats.uniqueUsers, icon: Users },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className={`h-4 w-4 ${iconClass || 'text-muted-foreground'}`} /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
          </Card>
        ))}
        <Card className={stats.criticalAlerts > 0 ? 'border-destructive/50 bg-destructive/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle><ShieldAlert className={`h-4 w-4 ${stats.criticalAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'}`} /></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${stats.criticalAlerts > 0 ? 'text-destructive' : ''}`}>{stats.criticalAlerts}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2"><Activity className="h-4 w-4" />Atividade em Tempo Real</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2"><Bell className="h-4 w-4" />Alertas de Segurança{stats.criticalAlerts > 0 && <Badge variant="destructive" className="ml-1">{stats.criticalAlerts}</Badge>}</TabsTrigger>
          <TabsTrigger value="login-attempts" className="gap-2"><LogIn className="h-4 w-4" />Tentativas de Login</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Eventos Recentes{isLive && <span className="relative flex h-2 w-2 ml-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span></span>}</CardTitle>
              <CardDescription>Últimos 50 eventos de acesso a dados sensíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {recentLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum evento registrado ainda</div>
                  ) : recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">{getActionIcon(log.action)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-medium truncate">{log.user_email || 'Sistema'}</span><Badge variant="outline" className="text-xs">{log.user_role || 'N/A'}</Badge></div>
                        <div className="text-sm text-muted-foreground"><span className="capitalize">{log.action}</span>{' em '}<span className="font-mono text-xs bg-muted px-1 rounded">{log.resource_type}</span>{log.resource_id && <span className="text-xs opacity-60"> ({log.resource_id.slice(0, 8)}...)</span>}</div>
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
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Alertas de Segurança</CardTitle><CardDescription>Alertas gerados automaticamente por padrões suspeitos</CardDescription></CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success/50" /><p>Nenhum alerta de segurança</p><p className="text-sm">Sistema operando normalmente</p></div>
                  ) : alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${alert.is_resolved ? 'bg-muted/50 opacity-60' : alert.severity === 'critical' ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1"><Badge className={getSeverityColor(alert.severity)}>{alert.severity === 'critical' ? 'Crítico' : alert.severity === 'warning' ? 'Aviso' : 'Info'}</Badge>{alert.is_resolved && <Badge variant="outline" className="text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" />Resolvido</Badge>}</div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-2"><Clock className="inline h-3 w-3 mr-1" />{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}</p>
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

        <TabsContent value="login-attempts">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><LogIn className="h-5 w-5" />Tentativas de Login</CardTitle><CardDescription>Histórico de tentativas de acesso ao sistema</CardDescription></CardHeader>
            <CardContent><div className="text-center py-8 text-muted-foreground"><LogIn className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>Em desenvolvimento</p><p className="text-sm">O monitoramento de tentativas de login será implementado em breve.</p></div></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityMonitoring;
