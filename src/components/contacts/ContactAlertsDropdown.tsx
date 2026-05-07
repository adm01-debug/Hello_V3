import { useState } from 'react';
import { 
  Bell, 
  Target, 
  AlertTriangle, 
  TrendingDown, 
  Crown,
  Check,
  Trash2,
  ChevronRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useContactAlerts, ContactAlert } from '@/hooks/useContactAlerts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function ContactAlertsDropdown() {
  const navigate = useNavigate();
  const { 
    alerts, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    markAsActioned,
    deleteAlert,
    checkForNewAlerts 
  } = useContactAlerts();
  const [isChecking, setIsChecking] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCheckAlerts = async () => {
    setIsChecking(true);
    await checkForNewAlerts();
    setIsChecking(false);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'buying_signal':
        return <Target className="h-4 w-4 text-success" />;
      case 'sentiment_negative':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'low_engagement':
        return <TrendingDown className="h-4 w-4 text-warning" />;
      case 'vip_inactive':
        return <Crown className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleAlertClick = (alert: ContactAlert) => {
    markAsRead(alert.id);
    setOpen(false);
    navigate('/contacts');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold">Alertas de Contatos</span>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} novos</Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleCheckAlerts}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                Marcar todos
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Nenhum alerta</p>
              <Button 
                variant="link" 
                size="sm" 
                onClick={handleCheckAlerts}
                className="mt-2"
              >
                Verificar agora
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 transition-colors hover:bg-muted/50 cursor-pointer',
                    !alert.is_read && 'bg-primary/5',
                    alert.is_actioned && 'opacity-60'
                  )}
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'rounded-full p-2',
                      getSeverityColor(alert.severity)
                    )}>
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-sm truncate',
                          !alert.is_read && 'font-semibold'
                        )}>
                          {alert.title}
                        </p>
                        {!alert.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.created_at), { 
                            locale: ptBR, 
                            addSuffix: true 
                          })}
                        </span>
                        {alert.is_actioned && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            <Check className="h-2 w-2 mr-1" />
                            Resolvido
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!alert.is_actioned && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsActioned(alert.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAlert(alert.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-between text-sm"
            onClick={() => {
              setOpen(false);
              navigate('/contacts/insights');
            }}
          >
            Ver todos os insights
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
