import { AlertCircle, Users, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  totalAlerts: number;
  totalUnread: number;
  totalCritical: number;
  contactPendingCount: number;
  callUnreadCount: number;
}

export function AlertStatsCards({ totalAlerts, totalUnread, totalCritical, contactPendingCount, callUnreadCount }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAlerts}</div>
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
          <Users className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{contactPendingCount}</div>
          <p className="text-xs text-muted-foreground">Aguardando ação</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chamadas Não Lidas</CardTitle>
          <Phone className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-info">{callUnreadCount}</div>
          <p className="text-xs text-muted-foreground">Alertas de chamadas</p>
        </CardContent>
      </Card>
    </div>
  );
}
