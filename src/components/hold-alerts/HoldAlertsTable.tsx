import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { AlertCircle, AlertTriangle, Bell, CheckCircle, Clock, Info, X } from 'lucide-react';
 import { formatDurationFriendly } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface HoldAlertRow {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
  call_session?: {
    caller_name: string | null;
    caller_phone: string | null;
    agent_name: string | null;
    hold_time_seconds: number | null;
  } | null;
}

const severityConfig = {
  info: { label: 'Informativo', icon: Info, color: 'bg-info/10 text-info border-info/20', badgeVariant: 'secondary' as const },
  warning: { label: 'Aviso', icon: AlertTriangle, color: 'bg-warning/10 text-warning border-warning/20', badgeVariant: 'outline' as const },
  critical: { label: 'Crítico', icon: AlertCircle, color: 'bg-destructive/10 text-destructive border-destructive/20', badgeVariant: 'destructive' as const },
};

interface Props {
  alerts: HoldAlertRow[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
}

export function HoldAlertsTable({ alerts, isLoading, onMarkAsRead }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas ({alerts.length})</CardTitle>
        <CardDescription>Lista de alertas de chamadas em espera no período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando alertas...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum alerta encontrado para os filtros selecionados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Gravidade</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Chamador</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Tempo em Espera</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => {
                const config = severityConfig[alert.severity] || severityConfig.info;
                const Icon = config.icon;
                return (
                  <TableRow key={alert.id} className={!alert.is_read ? 'bg-primary/5' : ''}>
                    <TableCell>
                      {!alert.is_read ? (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.badgeVariant} className={`${config.color} flex items-center gap-1 w-fit`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{alert.message}</p>
                      </div>
                    </TableCell>
                    <TableCell>{alert.call_session?.caller_name || alert.call_session?.caller_phone || '-'}</TableCell>
                    <TableCell>{alert.call_session?.agent_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                         {alert.call_session?.hold_time_seconds ? formatDurationFriendly(alert.call_session.hold_time_seconds) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(alert.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(alert.created_at), 'HH:mm:ss', { locale: ptBR })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {!alert.is_read && (
                        <Button size="icon" variant="ghost" onClick={() => onMarkAsRead(alert.id)} title="Marcar como lido">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
