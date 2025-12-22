import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Filter, Trash2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Alert {
  id: string;
  call_session_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('alerts_page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_alerts' },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let result = [...alerts];

    if (severityFilter !== 'all') {
      result = result.filter((a) => a.severity === severityFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((a) => a.alert_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((a) =>
        statusFilter === 'read' ? a.is_read : !a.is_read
      );
    }

    setFilteredAlerts(result);
  }, [alerts, severityFilter, typeFilter, statusFilter]);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('call_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Erro ao carregar alertas');
      return;
    }

    setAlerts(data || []);
    setIsLoading(false);
  };

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('call_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
      toast.success('Alerta marcado como lido');
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('call_alerts')
      .update({ is_read: true })
      .eq('is_read', false);

    if (!error) {
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
      toast.success('Todos os alertas marcados como lidos');
    }
  };

  const createTestAlerts = async () => {
    let sessionId: string;

    const { data: existingSession } = await supabase
      .from('call_sessions')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessionError } = await supabase
        .from('call_sessions')
        .insert({
          caller_name: 'Cliente Teste',
          caller_phone: '+55 11 99999-9999',
          agent_name: 'Agente Teste',
          status: 'completed',
        })
        .select('id')
        .single();

      if (sessionError || !newSession) {
        toast.error('Erro ao criar sessão de teste');
        return;
      }
      sessionId = newSession.id;
    }

    const testAlerts = [
      {
        call_session_id: sessionId,
        alert_type: 'negative_sentiment',
        severity: 'critical',
        title: 'Sentimento Negativo Detectado',
        message: 'Cliente expressou frustração durante a chamada. Recomenda-se acompanhamento.',
      },
      {
        call_session_id: sessionId,
        alert_type: 'low_satisfaction',
        severity: 'warning',
        title: 'Satisfação Baixa',
        message: 'Pontuação de satisfação do cliente: 2/10. Verificar qualidade do atendimento.',
      },
      {
        call_session_id: sessionId,
        alert_type: 'high_urgency',
        severity: 'critical',
        title: 'Alta Urgência',
        message: 'Chamada marcada como urgente. Cliente solicitou resolução imediata.',
      },
    ];

    const { error } = await supabase.from('call_alerts').insert(testAlerts);

    if (error) {
      toast.error('Erro ao criar alertas de teste');
      console.error('Error creating test alerts:', error);
    } else {
      toast.success('3 alertas de teste criados!');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">Aviso</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      negative_sentiment: 'Sentimento Negativo',
      low_satisfaction: 'Baixa Satisfação',
      high_urgency: 'Alta Urgência',
    };
    return (
      <Badge variant="outline" className="text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.is_read).length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && !a.is_read).length;

  const alertTypes = [...new Set(alerts.map((a) => a.alert_type))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Alertas</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore todos os alertas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createTestAlerts}>
            <FlaskConical className="h-4 w-4 mr-2" />
            Criar Alertas Teste
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Marcar Todos como Lidos
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">{unreadCount} não lidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avisos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
            <p className="text-xs text-muted-foreground">Monitorar situação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {alerts.length > 0
                ? Math.round(((alerts.length - unreadCount) / alerts.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Alertas resolvidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Severidade</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="info">Informativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="negative_sentiment">Sentimento Negativo</SelectItem>
                  <SelectItem value="low_satisfaction">Baixa Satisfação</SelectItem>
                  <SelectItem value="high_urgency">Alta Urgência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unread">Não Lidos</SelectItem>
                  <SelectItem value="read">Lidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Alertas ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum alerta encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou criar alertas de teste</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      !alert.is_read
                        ? 'bg-muted/50 border-primary/20'
                        : 'bg-background border-border'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-0.5">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          {!alert.is_read && (
                            <span className="h-2 w-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(alert.severity)}
                          {getTypeBadge(alert.alert_type)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({formatDistanceToNow(new Date(alert.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })})
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!alert.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
