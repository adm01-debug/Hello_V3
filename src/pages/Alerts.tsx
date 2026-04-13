import { AlertTriangle, AlertCircle, Info, Check, Filter, Trash2, FlaskConical, Users, Phone, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { AlertsTrendChart } from '@/components/alerts/AlertsTrendChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAlerts, ContactAlert, CallAlert } from '@/hooks/useAlerts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AlertStatsCards } from '@/components/alerts/AlertStatsCards';
import { ContactAlertsList } from '@/components/alerts/ContactAlertsList';
import { CallAlertsList } from '@/components/alerts/CallAlertsList';

export default function Alerts() {
  usePageTitle('Alertas');
  const alerts = useAlerts();

  return (
    <div className="container mx-auto p-6 space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Central de Alertas</h1>
            <p className="text-muted-foreground">Gerencie todos os alertas de chamadas e contatos</p>
          </div>
          <Button variant="neon" onClick={alerts.checkForNewAlerts} disabled={alerts.isCheckingAlerts}>
            <RefreshCw className={`h-4 w-4 mr-2 ${alerts.isCheckingAlerts ? 'animate-spin' : ''}`} />
            Verificar Alertas
          </Button>
        </div>

        <AlertStatsCards
          totalAlerts={alerts.callAlerts.length + alerts.contactAlerts.length}
          totalUnread={alerts.totalUnread}
          totalCritical={alerts.totalCritical}
          contactPendingCount={alerts.contactPendingCount}
          callUnreadCount={alerts.callUnreadCount}
        />

        <AlertsTrendChart />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-5 w-5" />Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Severidade</label>
                <Select value={alerts.severityFilter} onValueChange={alerts.setSeverityFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todas" /></SelectTrigger>
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
                <Select value={alerts.typeFilter} onValueChange={alerts.setTypeFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {alerts.activeTab === 'contacts' ? (
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
                <Select value={alerts.statusFilter} onValueChange={alerts.setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="unread">Não Lidos</SelectItem>
                    <SelectItem value="read">Lidos</SelectItem>
                    {alerts.activeTab === 'contacts' && (
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

        <Tabs value={alerts.activeTab} onValueChange={alerts.setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />Contatos ({alerts.contactAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />Chamadas ({alerts.callAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4">
            <ContactAlertsList alerts={alerts} />
          </TabsContent>

          <TabsContent value="calls" className="mt-4">
            <CallAlertsList alerts={alerts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
