import { Bell, BellOff, BellRing, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyNotificationsState } from '@/components/ui/empty-state';
import { useRealtimeHoldAlerts } from '@/hooks/useRealtimeHoldAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell() {
  const navigate = useNavigate();
  const {
    isEnabled,
    toggleNotifications,
    browserNotificationsGranted,
    requestBrowserNotifications,
    recentAlerts,
    unreadCount,
    markAllAsRead,
  } = useRealtimeHoldAlerts();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label={`Notificações${unreadCount > 0 ? ` - ${unreadCount} não lidas` : ''}`}
        >
          {isEnabled ? (
            unreadCount > 0 ? (
              <BellRing className="h-5 w-5 animate-pulse text-primary" aria-hidden="true" />
            ) : (
              <Bell className="h-5 w-5" aria-hidden="true" />
            )
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
              aria-label={`${unreadCount} notificações não lidas`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notificações em Tempo Real</h4>
            <Switch
              checked={isEnabled}
              onCheckedChange={toggleNotifications}
            />
          </div>

          {!browserNotificationsGranted && isEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={requestBrowserNotifications}
            >
              <Bell className="h-4 w-4 mr-2" />
              Ativar Notificações do Navegador
            </Button>
          )}

          {browserNotificationsGranted && isEnabled && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Notificações do navegador ativas
            </p>
          )}

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}

          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Alertas recentes
            </p>
            <ScrollArea className="h-[200px]">
              {recentAlerts.length === 0 ? (
                <EmptyNotificationsState />
              ) : (
                <div className="space-y-2">
                  {recentAlerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2 rounded-lg border text-sm ${
                        !alert.is_read ? 'bg-accent/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getSeverityColor(alert.severity)}`}
                            >
                              {alert.severity === 'critical' || alert.severity === 'error' 
                                ? 'Crítico' 
                                : 'Aviso'}
                            </Badge>
                          </div>
                          <p className="text-xs mt-1 text-muted-foreground truncate">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.created_at), { 
                          addSuffix: true,
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="border-t pt-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs gap-1"
              onClick={() => navigate('/notifications')}
            >
              <ExternalLink className="h-3 w-3" />
              Ver todas as notificações
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
