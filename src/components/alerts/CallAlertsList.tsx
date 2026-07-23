import { AlertTriangle, AlertCircle, Info, Check, FlaskConical, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

import { ptBR } from 'date-fns/locale';
import { safeFormatDatePtBR, safeFormatDistanceToNow } from "@/lib/safe-date";

interface Props {
  alerts: {
    filteredCallAlerts: Array<{
      id: string; severity: string; title: string; message: string;
      is_read: boolean; alert_type: string; created_at: string;
    }>;
    selectedCallAlerts: Set<string>;
    isLoading: boolean;
    callUnreadCount: number;
    toggleCallAlertSelection: (id: string) => void;
    selectAllCallAlerts: () => void;
    batchMarkCallAlertsAsRead: () => void;
    markAllCallAlertsAsRead: () => void;
    markCallAlertAsRead: (id: string) => void;
    createTestAlerts: () => void;
  };
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return <AlertCircle className="h-5 w-5 text-destructive" />;
    case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
    default: return <Info className="h-5 w-5 text-info" />;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical': return <Badge variant="destructive">Crítico</Badge>;
    case 'warning': return <Badge className="bg-warning/20 text-warning hover:bg-warning/30">Aviso</Badge>;
    default: return <Badge variant="secondary">Info</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  const typeLabels: Record<string, string> = {
    negative_sentiment: 'Sentimento Negativo', low_satisfaction: 'Baixa Satisfação',
    high_urgency: 'Alta Urgência', buying_signal: 'Sinal de Compra',
    low_engagement: 'Baixo Engajamento', inactive_vip: 'VIP Inativo',
  };
  return <Badge variant="outline" className="text-xs">{typeLabels[type] || type}</Badge>;
};

export function CallAlertsList({ alerts }: Props) {
  const { filteredCallAlerts, selectedCallAlerts, isLoading } = alerts;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alertas de Chamadas ({filteredCallAlerts.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={alerts.createTestAlerts}>
              <FlaskConical className="h-4 w-4 mr-1" />Criar Testes
            </Button>
            {selectedCallAlerts.size > 0 && (
              <Button variant="outline" size="sm" onClick={alerts.batchMarkCallAlertsAsRead}>
                <Check className="h-4 w-4 mr-1" />Marcar como Lido ({selectedCallAlerts.size})
              </Button>
            )}
            {alerts.callUnreadCount > 0 && (
              <Button size="sm" onClick={alerts.markAllCallAlertsAsRead}>
                <Check className="h-4 w-4 mr-1" />Marcar Todos
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                onCheckedChange={alerts.selectAllCallAlerts}
              />
              <span className="text-sm text-muted-foreground">
                {selectedCallAlerts.size > 0 ? `${selectedCallAlerts.size} selecionado(s)` : 'Selecionar todos'}
              </span>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredCallAlerts.map(alert => (
                  <div key={alert.id} className={`p-4 rounded-lg border transition-colors ${!alert.is_read ? 'bg-muted/50 border-primary/20' : 'bg-background border-border'}`}>
                    <div className="flex items-start gap-4">
                      <Checkbox checked={selectedCallAlerts.has(alert.id)} onCheckedChange={() => alerts.toggleCallAlertSelection(alert.id)} />
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
                            {safeFormatDatePtBR(alert.created_at, "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({safeFormatDistanceToNow(alert.created_at, { addSuffix: true, locale: ptBR })})
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!alert.is_read && (
                          <Button variant="ghost" size="sm" onClick={() => alerts.markCallAlertAsRead(alert.id)}>
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
  );
}
