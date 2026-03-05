
import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  is_resolved: boolean;
}

export function useSecurityNotifications() {
  const { user } = useAuthContext();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificações ativadas!', {
          description: 'Você receberá alertas de segurança em tempo real.',
        });
        return true;
      } else if (result === 'denied') {
        toast.error('Notificações bloqueadas', {
          description: 'Ative nas configurações do navegador para receber alertas.',
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Show a browser notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission]);

  // Format alert for notification
  const formatAlertNotification = useCallback((alert: SecurityAlert) => {
    const severityEmoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
    }[alert.severity] || '🔔';

    const severityText = {
      critical: 'CRÍTICO',
      warning: 'Aviso',
      info: 'Informação',
    }[alert.severity] || 'Alerta';

    return {
      title: `${severityEmoji} ${severityText}: ${alert.title}`,
      options: {
        body: alert.description,
        tag: `security-alert-${alert.id}`,
        data: { alertId: alert.id },
        vibrate: alert.severity === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200],
      } as NotificationOptions,
    };
  }, []);

  // Subscribe to real-time security alerts
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    console.log('[SecurityNotifications] Setting up real-time subscription');

    const channel = supabase
      .channel('security-alerts-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
        },
        (payload) => {
          console.log('[SecurityNotifications] New alert received:', payload);
          const alert = payload.new as SecurityAlert;
          
          // Show browser notification
          const { title, options } = formatAlertNotification(alert);
          showNotification(title, options);

          // Also show a toast for in-app notification
          const toastVariant = alert.severity === 'critical' ? 'error' : 
                              alert.severity === 'warning' ? 'warning' : 'info';
          
          toast[toastVariant === 'error' ? 'error' : toastVariant === 'warning' ? 'warning' : 'info'](
            alert.title,
            { description: alert.description }
          );
        }
      )
      .subscribe((status) => {
        console.log('[SecurityNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[SecurityNotifications] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification, formatAlertNotification]);

  // Subscribe to blocked access attempts
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('blocked-access-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blocked_access_logs',
        },
        (payload) => {
          console.log('[SecurityNotifications] Blocked access detected:', payload);
          const log = payload.new as {
            id: string;
            ip_address: string;
            user_email?: string;
            city?: string;
            country?: string;
            reason: string;
          };

          const location = log.city && log.country 
            ? `${log.city}, ${log.country}` 
            : log.country || 'Localização desconhecida';

          showNotification('🚫 Acesso Bloqueado', {
            body: `IP: ${log.ip_address}\nLocalização: ${location}\nMotivo: ${log.reason}`,
            tag: `blocked-access-${log.id}`,
            vibrate: [200, 100, 200, 100, 200],
          });

          toast.error('Acesso bloqueado detectado', {
            description: `IP ${log.ip_address} de ${location}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  // Subscribe to rate limit alerts
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('rate-limit-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rate_limit_alerts',
        },
        (payload) => {
          console.log('[SecurityNotifications] Rate limit alert:', payload);
          const alert = payload.new as {
            id: string;
            ip_address: string;
            endpoint: string;
            request_count: number;
            severity: string;
          };

          showNotification('⚡ Rate Limit Excedido', {
            body: `IP: ${alert.ip_address}\nEndpoint: ${alert.endpoint}\nRequests: ${alert.request_count}`,
            tag: `rate-limit-${alert.id}`,
            vibrate: [200, 100, 200],
          });

          toast.warning('Rate limit excedido', {
            description: `${alert.request_count} requisições de ${alert.ip_address}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
}
