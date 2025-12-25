import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  ShieldAlert, 
  Activity,
  Eye,
  Download,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Bell,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: unknown;
  created_at: string;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  source_user_id: string | null;
  source_user_email: string | null;
  trigger_data: Record<string, unknown> | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

interface ActivityStats {
  totalEvents: number;
  viewEvents: number;
  exportEvents: number;
  downloadEvents: number;
  uniqueUsers: number;
  criticalAlerts: number;
}

const SecurityMonitoring = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalEvents: 0,
    viewEvents: 0,
    exportEvents: 0,
    downloadEvents: 0,
    uniqueUsers: 0,
    criticalAlerts: 0
  });
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      navigate('/unauthorized');
    }
  }, [profile, loading, navigate]);

  const fetchData = useCallback(async () => {
    // Fetch recent audit logs
    const { data: logsData } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsData) {
      const typedLogs = logsData as unknown as AuditLog[];
      setRecentLogs(typedLogs);
      
      // Calculate stats
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentData = typedLogs.filter(log => new Date(log.created_at) > last24h);
      
      setStats({
        totalEvents: recentData.length,
        viewEvents: recentData.filter(l => l.action === 'view').length,
        exportEvents: recentData.filter(l => l.action === 'export').length,
        downloadEvents: recentData.filter(l => l.action === 'download').length,
        uniqueUsers: new Set(recentData.map(l => l.user_id)).size,
        criticalAlerts: 0 // Will be updated from alerts
      });
    }

    // Fetch security alerts
    const { data: alertsData } = await supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (alertsData) {
      setAlerts(alertsData as SecurityAlert[]);
      setStats(prev => ({
        ...prev,
        criticalAlerts: (alertsData as SecurityAlert[]).filter(a => !a.is_resolved && a.severity === 'critical').length
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription for audit logs
  useEffect(() => {
    if (!isLive) return;

    const logsChannel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setRecentLogs(prev => [newLog, ...prev.slice(0, 49)]);
          setStats(prev => ({
            ...prev,
            totalEvents: prev.totalEvents + 1,
            viewEvents: newLog.action === 'view' ? prev.viewEvents + 1 : prev.viewEvents,
            exportEvents: newLog.action === 'export' ? prev.exportEvents + 1 : prev.exportEvents,
            downloadEvents: newLog.action === 'download' ? prev.downloadEvents + 1 : prev.downloadEvents
          }));
          
          toast.info(`Novo evento: ${newLog.action} em ${newLog.resource_type}`, {
            description: newLog.user_email || 'Sistema'
          });
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('security-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts'
        },
        (payload) => {
          const newAlert = payload.new as SecurityAlert;
          setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
          
          if (newAlert.severity === 'critical') {
            setStats(prev => ({
              ...prev,
              criticalAlerts: prev.criticalAlerts + 1
            }));
          }
          
          toast.error(`Alerta de Segurança: ${newAlert.title}`, {
            description: newAlert.description,
            duration: 10000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [isLive]);

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('security_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: profile?.email
      })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.map(a => 
        a.id === alertId 
          ? { ...a, is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: profile?.email || null }
          : a
      ));
      setStats(prev => ({
        ...prev,
        criticalAlerts: Math.max(0, prev.criticalAlerts - 1)
      }));
      toast.success('Alerta resolvido');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'export':
        return <Download className="h-4 w-4 text-yellow-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'create':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'update':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Monitoramento de Segurança
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento em tempo real de acessos e alertas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className="gap-2"
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Ao Vivo
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Pausado
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Eventos (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exportações</CardTitle>
            <Download className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exportEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.downloadEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card className={stats.criticalAlerts > 0 ? 'border-red-500/50 bg-red-500/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <ShieldAlert className={`h-4 w-4 ${stats.criticalAlerts > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.criticalAlerts > 0 ? 'text-red-500' : ''}`}>
              {stats.criticalAlerts}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Atividade em Tempo Real
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alertas de Segurança
            {stats.criticalAlerts > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.criticalAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Eventos Recentes
                {isLive && (
                  <span className="relative flex h-2 w-2 ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Últimos 50 eventos de acesso a dados sensíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {recentLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum evento registrado ainda
                    </div>
                  ) : (
                    recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {log.user_email || 'Sistema'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.user_role || 'N/A'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="capitalize">{log.action}</span>
                            {' em '}
                            <span className="font-mono text-xs bg-muted px-1 rounded">
                              {log.resource_type}
                            </span>
                            {log.resource_id && (
                              <span className="text-xs opacity-60">
                                {' '}({log.resource_id.slice(0, 8)}...)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.created_at), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Alertas de Segurança
              </CardTitle>
              <CardDescription>
                Alertas gerados automaticamente por padrões suspeitos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500/50" />
                      <p>Nenhum alerta de segurança</p>
                      <p className="text-sm">Sistema operando normalmente</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.is_resolved 
                            ? 'bg-muted/50 opacity-60' 
                            : alert.severity === 'critical' 
                              ? 'border-red-500/50 bg-red-500/5' 
                              : 'border-yellow-500/50 bg-yellow-500/5'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {alert.is_resolved ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : alert.severity === 'critical' ? (
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{alert.title}</h4>
                                <Badge className={getSeverityColor(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {alert.description}
                              </p>
                              {alert.source_user_email && (
                                <p className="text-sm mt-2">
                                  <span className="text-muted-foreground">Usuário: </span>
                                  <span className="font-mono">{alert.source_user_email}</span>
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </p>
                              {alert.is_resolved && alert.resolved_by && (
                                <p className="text-xs text-green-500 mt-1">
                                  Resolvido por {alert.resolved_by}
                                </p>
                              )}
                            </div>
                          </div>
                          {!alert.is_resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detection Rules Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regras de Detecção Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Acesso Excessivo a Contatos
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Alerta crítico quando um usuário acessa mais de 50 contatos em 5 minutos
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Exportação em Massa
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Alerta crítico quando um usuário realiza mais de 3 exportações em 10 minutos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityMonitoring;
