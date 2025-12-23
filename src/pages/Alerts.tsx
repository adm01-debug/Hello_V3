import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, Check, Filter, Trash2, FlaskConical, Users, Phone, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { AlertsTrendChart } from '@/components/alerts/AlertsTrendChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface CallAlert {
  id: string;
  call_session_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ContactAlert {
  id: string;
  contact_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  trigger_data: Record<string, unknown>;
  is_read: boolean;
  is_actioned: boolean;
  actioned_at: string | null;
  actioned_by: string | null;
  created_at: string;
  contact?: { name: string; company: string | null };
}

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('contacts');
  
  // Call alerts state
  const [callAlerts, setCallAlerts] = useState<CallAlert[]>([]);
  const [filteredCallAlerts, setFilteredCallAlerts] = useState<CallAlert[]>([]);
  const [selectedCallAlerts, setSelectedCallAlerts] = useState<Set<string>>(new Set());
  
  // Contact alerts state
  const [contactAlerts, setContactAlerts] = useState<ContactAlert[]>([]);
  const [filteredContactAlerts, setFilteredContactAlerts] = useState<ContactAlert[]>([]);
  const [selectedContactAlerts, setSelectedContactAlerts] = useState<Set<string>>(new Set());
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);

  useEffect(() => {
    fetchAllAlerts();

    const callChannel = supabase
      .channel('alerts_page_calls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_alerts' }, () => fetchCallAlerts())
      .subscribe();

    const contactChannel = supabase
      .channel('alerts_page_contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_alerts' }, () => fetchContactAlerts())
      .subscribe();

    return () => {
      supabase.removeChannel(callChannel);
      supabase.removeChannel(contactChannel);
    };
  }, []);

  // Filter call alerts
  useEffect(() => {
    let result = [...callAlerts];
    if (severityFilter !== 'all') result = result.filter((a) => a.severity === severityFilter);
    if (typeFilter !== 'all') result = result.filter((a) => a.alert_type === typeFilter);
    if (statusFilter !== 'all') result = result.filter((a) => statusFilter === 'read' ? a.is_read : !a.is_read);
    setFilteredCallAlerts(result);
  }, [callAlerts, severityFilter, typeFilter, statusFilter]);

  // Filter contact alerts
  useEffect(() => {
    let result = [...contactAlerts];
    if (severityFilter !== 'all') result = result.filter((a) => a.severity === severityFilter);
    if (typeFilter !== 'all') result = result.filter((a) => a.alert_type === typeFilter);
    if (statusFilter !== 'all') {
      if (statusFilter === 'read') result = result.filter((a) => a.is_read);
      else if (statusFilter === 'unread') result = result.filter((a) => !a.is_read);
      else if (statusFilter === 'actioned') result = result.filter((a) => a.is_actioned);
      else if (statusFilter === 'pending') result = result.filter((a) => !a.is_actioned);
    }
    setFilteredContactAlerts(result);
  }, [contactAlerts, severityFilter, typeFilter, statusFilter]);

  const fetchAllAlerts = async () => {
    setIsLoading(true);
    await Promise.all([fetchCallAlerts(), fetchContactAlerts()]);
    setIsLoading(false);
  };

  const fetchCallAlerts = async () => {
    const { data, error } = await supabase
      .from('call_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setCallAlerts(data || []);
  };

  const fetchContactAlerts = async () => {
    const { data, error } = await supabase
      .from('contact_alerts')
      .select('*, contact:contacts(name, company)')
      .order('created_at', { ascending: false });

    if (!error) {
      const typedData = (data || []) as unknown as ContactAlert[];
      setContactAlerts(typedData);
    }
  };

  const checkForNewAlerts = async () => {
    setIsCheckingAlerts(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-contact-alerts');
      if (error) throw error;
      if (data?.alerts_created > 0) {
        toast.success(`${data.alerts_created} novos alertas gerados`);
        await fetchContactAlerts();
      } else {
        toast.info('Nenhum novo alerta detectado');
      }
    } catch (err) {
      console.error('Error checking alerts:', err);
      toast.error('Erro ao verificar alertas');
    } finally {
      setIsCheckingAlerts(false);
    }
  };

  // Call alert actions
  const markCallAlertAsRead = async (alertId: string) => {
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).eq('id', alertId);
    if (!error) {
      setCallAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)));
      toast.success('Alerta marcado como lido');
    }
  };

  const markAllCallAlertsAsRead = async () => {
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).eq('is_read', false);
    if (!error) {
      setCallAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
      toast.success('Todos os alertas marcados como lidos');
    }
  };

  const batchMarkCallAlertsAsRead = async () => {
    if (selectedCallAlerts.size === 0) return;
    const ids = Array.from(selectedCallAlerts);
    const { error } = await supabase.from('call_alerts').update({ is_read: true }).in('id', ids);
    if (!error) {
      setCallAlerts((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, is_read: true } : a)));
      setSelectedCallAlerts(new Set());
      toast.success(`${ids.length} alertas marcados como lidos`);
    }
  };

  // Contact alert actions
  const markContactAlertAsRead = async (alertId: string) => {
    const { error } = await supabase.from('contact_alerts').update({ is_read: true }).eq('id', alertId);
    if (!error) {
      setContactAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)));
    }
  };

  const markContactAlertAsActioned = async (alertId: string) => {
    const { error } = await supabase
      .from('contact_alerts')
      .update({ is_actioned: true, actioned_at: new Date().toISOString(), actioned_by: 'Usuário' })
      .eq('id', alertId);
    if (!error) {
      setContactAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_actioned: true, actioned_at: new Date().toISOString() } : a))
      );
      toast.success('Alerta marcado como resolvido');
    }
  };

  const deleteContactAlert = async (alertId: string) => {
    const { error } = await supabase.from('contact_alerts').delete().eq('id', alertId);
    if (!error) {
      setContactAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success('Alerta removido');
    }
  };

  const batchMarkContactAlertsAsRead = async () => {
    if (selectedContactAlerts.size === 0) return;
    const ids = Array.from(selectedContactAlerts);
    const { error } = await supabase.from('contact_alerts').update({ is_read: true }).in('id', ids);
    if (!error) {
      setContactAlerts((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, is_read: true } : a)));
      setSelectedContactAlerts(new Set());
      toast.success(`${ids.length} alertas marcados como lidos`);
    }
  };

  const batchMarkContactAlertsAsActioned = async () => {
    if (selectedContactAlerts.size === 0) return;
    const ids = Array.from(selectedContactAlerts);
    const { error } = await supabase
      .from('contact_alerts')
      .update({ is_actioned: true, actioned_at: new Date().toISOString(), actioned_by: 'Usuário' })
      .in('id', ids);
    if (!error) {
      setContactAlerts((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, is_actioned: true, actioned_at: new Date().toISOString() } : a))
      );
      setSelectedContactAlerts(new Set());
      toast.success(`${ids.length} alertas marcados como resolvidos`);
    }
  };

  const batchDeleteContactAlerts = async () => {
    if (selectedContactAlerts.size === 0) return;
    const ids = Array.from(selectedContactAlerts);
    const { error } = await supabase.from('contact_alerts').delete().in('id', ids);
    if (!error) {
      setContactAlerts((prev) => prev.filter((a) => !ids.includes(a.id)));
      setSelectedContactAlerts(new Set());
      toast.success(`${ids.length} alertas removidos`);
    }
  };

  // Selection helpers
  const toggleCallAlertSelection = (id: string) => {
    setSelectedCallAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleContactAlertSelection = (id: string) => {
    setSelectedContactAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllCallAlerts = () => {
    if (selectedCallAlerts.size === filteredCallAlerts.length) {
      setSelectedCallAlerts(new Set());
    } else {
      setSelectedCallAlerts(new Set(filteredCallAlerts.map((a) => a.id)));
    }
  };

  const selectAllContactAlerts = () => {
    if (selectedContactAlerts.size === filteredContactAlerts.length) {
      setSelectedContactAlerts(new Set());
    } else {
      setSelectedContactAlerts(new Set(filteredContactAlerts.map((a) => a.id)));
    }
  };

  // Test alerts
  const createTestAlerts = async () => {
    let sessionId: string;
    const { data: existingSession } = await supabase.from('call_sessions').select('id').limit(1).maybeSingle();

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessionError } = await supabase
        .from('call_sessions')
        .insert({ caller_name: 'Cliente Teste', caller_phone: '+55 11 99999-9999', agent_name: 'Agente Teste', status: 'completed' })
        .select('id')
        .single();
      if (sessionError || !newSession) {
        toast.error('Erro ao criar sessão de teste');
        return;
      }
      sessionId = newSession.id;
    }

    const testAlerts = [
      { call_session_id: sessionId, alert_type: 'negative_sentiment', severity: 'critical', title: 'Sentimento Negativo Detectado', message: 'Cliente expressou frustração durante a chamada.' },
      { call_session_id: sessionId, alert_type: 'low_satisfaction', severity: 'warning', title: 'Satisfação Baixa', message: 'Pontuação de satisfação do cliente: 2/10.' },
      { call_session_id: sessionId, alert_type: 'high_urgency', severity: 'critical', title: 'Alta Urgência', message: 'Chamada marcada como urgente.' },
    ];

    const { error } = await supabase.from('call_alerts').insert(testAlerts);
    if (!error) toast.success('3 alertas de teste criados!');
    else toast.error('Erro ao criar alertas de teste');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Crítico</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">Aviso</Badge>;
      default: return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      negative_sentiment: 'Sentimento Negativo',
      low_satisfaction: 'Baixa Satisfação',
      high_urgency: 'Alta Urgência',
      buying_signal: 'Sinal de Compra',
      low_engagement: 'Baixo Engajamento',
      inactive_vip: 'VIP Inativo',
    };
    return <Badge variant="outline" className="text-xs">{typeLabels[type] || type}</Badge>;
  };

  // Stats
  const callUnreadCount = callAlerts.filter((a) => !a.is_read).length;
  const callCriticalCount = callAlerts.filter((a) => a.severity === 'critical' && !a.is_read).length;
  const contactUnreadCount = contactAlerts.filter((a) => !a.is_read).length;
  const contactPendingCount = contactAlerts.filter((a) => !a.is_actioned).length;
  const contactCriticalCount = contactAlerts.filter((a) => a.severity === 'critical' && !a.is_actioned).length;

  const totalUnread = callUnreadCount + contactUnreadCount;
  const totalCritical = callCriticalCount + contactCriticalCount;

  const contactAlertTypes = ['buying_signal', 'negative_sentiment', 'low_engagement', 'inactive_vip'];
  const callAlertTypes = ['negative_sentiment', 'low_satisfaction', 'high_urgency'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Alertas</h1>
          <p className="text-muted-foreground">Gerencie todos os alertas de chamadas e contatos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkForNewAlerts} disabled={isCheckingAlerts}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingAlerts ? 'animate-spin' : ''}`} />
            Verificar Alertas
          </Button>
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
            <div className="text-2xl font-bold">{callAlerts.length + contactAlerts.length}</div>
            <p className="text-xs text-muted-foreground">{totalUnread} não lidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalCritical}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Pendentes</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{contactPendingCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando ação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamadas Não Lidas</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{callUnreadCount}</div>
            <p className="text-xs text-muted-foreground">Alertas de chamadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <AlertsTrendChart />

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
                  {activeTab === 'contacts' ? (
                    <>
                      <SelectItem value="buying_signal">Sinal de Compra</SelectItem>
                      <SelectItem value="negative_sentiment">Sentimento Negativo</SelectItem>
                      <SelectItem value="low_engagement">Baixo Engajamento</SelectItem>
                      <SelectItem value="inactive_vip">VIP Inativo</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="negative_sentiment">Sentimento Negativo</SelectItem>
                      <SelectItem value="low_satisfaction">Baixa Satisfação</SelectItem>
                      <SelectItem value="high_urgency">Alta Urgência</SelectItem>
                    </>
                  )}
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
                  {activeTab === 'contacts' && (
                    <>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="actioned">Resolvidos</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contatos ({contactAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Chamadas ({callAlerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Contact Alerts Tab */}
        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alertas de Contatos ({filteredContactAlerts.length})</CardTitle>
                <div className="flex gap-2">
                  {selectedContactAlerts.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={batchMarkContactAlertsAsRead}>
                        <Check className="h-4 w-4 mr-1" />
                        Marcar como Lido ({selectedContactAlerts.size})
                      </Button>
                      <Button variant="outline" size="sm" onClick={batchMarkContactAlertsAsActioned}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Resolver ({selectedContactAlerts.size})
                      </Button>
                      <Button variant="destructive" size="sm" onClick={batchDeleteContactAlerts}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir ({selectedContactAlerts.size})
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredContactAlerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum alerta de contato encontrado</p>
                  <p className="text-sm">Use o botão "Verificar Alertas" para detectar novos alertas</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <Checkbox
                      checked={selectedContactAlerts.size === filteredContactAlerts.length && filteredContactAlerts.length > 0}
                      onCheckedChange={selectAllContactAlerts}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedContactAlerts.size > 0
                        ? `${selectedContactAlerts.size} selecionado(s)`
                        : 'Selecionar todos'}
                    </span>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredContactAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            !alert.is_read ? 'bg-muted/50 border-primary/20' : 'bg-background border-border'
                          } ${alert.is_actioned ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedContactAlerts.has(alert.id)}
                              onCheckedChange={() => toggleContactAlertSelection(alert.id)}
                            />
                            <div className="shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold">{alert.title}</h4>
                                {!alert.is_read && <span className="h-2 w-2 bg-primary rounded-full" />}
                                {alert.is_actioned && (
                                  <Badge variant="outline" className="text-green-500 border-green-500/30">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Resolvido
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                              {alert.contact && (
                                <p className="text-sm font-medium mb-2">
                                  {alert.contact.name}
                                  {alert.contact.company && <span className="text-muted-foreground"> • {alert.contact.company}</span>}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                {getSeverityBadge(alert.severity)}
                                {getTypeBadge(alert.alert_type)}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })})
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 flex gap-1">
                              {!alert.is_read && (
                                <Button variant="ghost" size="sm" onClick={() => markContactAlertAsRead(alert.id)} title="Marcar como lido">
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {!alert.is_actioned && (
                                <Button variant="ghost" size="sm" onClick={() => markContactAlertAsActioned(alert.id)} title="Marcar como resolvido">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => deleteContactAlert(alert.id)} title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Call Alerts Tab */}
        <TabsContent value="calls" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alertas de Chamadas ({filteredCallAlerts.length})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={createTestAlerts}>
                    <FlaskConical className="h-4 w-4 mr-1" />
                    Criar Testes
                  </Button>
                  {selectedCallAlerts.size > 0 && (
                    <Button variant="outline" size="sm" onClick={batchMarkCallAlertsAsRead}>
                      <Check className="h-4 w-4 mr-1" />
                      Marcar como Lido ({selectedCallAlerts.size})
                    </Button>
                  )}
                  {callUnreadCount > 0 && (
                    <Button size="sm" onClick={markAllCallAlertsAsRead}>
                      <Check className="h-4 w-4 mr-1" />
                      Marcar Todos
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCallAlerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum alerta de chamada encontrado</p>
                  <p className="text-sm">Use o botão "Criar Testes" para simular alertas</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                    <Checkbox
                      checked={selectedCallAlerts.size === filteredCallAlerts.length && filteredCallAlerts.length > 0}
                      onCheckedChange={selectAllCallAlerts}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedCallAlerts.size > 0 ? `${selectedCallAlerts.size} selecionado(s)` : 'Selecionar todos'}
                    </span>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredCallAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            !alert.is_read ? 'bg-muted/50 border-primary/20' : 'bg-background border-border'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox
                              checked={selectedCallAlerts.has(alert.id)}
                              onCheckedChange={() => toggleCallAlertSelection(alert.id)}
                            />
                            <div className="shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold">{alert.title}</h4>
                                {!alert.is_read && <span className="h-2 w-2 bg-primary rounded-full" />}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {getSeverityBadge(alert.severity)}
                                {getTypeBadge(alert.alert_type)}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })})
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {!alert.is_read && (
                                <Button variant="ghost" size="sm" onClick={() => markCallAlertAsRead(alert.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
