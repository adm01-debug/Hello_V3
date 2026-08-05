
import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('SecurityNotifications');

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

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notificações ativadas!', { description: 'Você receberá alertas de segurança em tempo real.' });
        return true;
      } else if (result === 'denied') {
        toast.error('Notificações bloqueadas', { description: 'Ative nas configurações do navegador para receber alertas.' });
      }
      return false;
    } catch (error) {
      log.error('Error requesting notification permission', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      log.debug('Permission not granted');
      return;
    }
    try {
      const notification = new Notification(title, { icon: '/favicon.ico', badge: '/favicon.ico', requireInteraction: true, ...options });
      notification.onclick = () => { window.focus(); notification.close(); };
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      log.error('Error showing notification', error);
    }
  }, [permission]);

  const formatAlertNotification = useCallback((alert: SecurityAlert) => {
    const severityEmoji = { critical: '🚨', warning: '⚠️', info: 'ℹ️' }[alert.severity] || '🔔';
    const severityText = { critical: 'CRÍTICO', warning: 'Aviso', info: 'Informação' }[alert.severity] || 'Alerta';
    return {
      title: `${severityEmoji} ${severityText}: ${alert.title}`,
      options: { body: alert.description, tag: `security-alert-${alert.id}`, data: { alertId: alert.id }, vibrate: alert.severity === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200] } as NotificationOptions,
    };
  }, []);

  useEffect(() => {
    if (!user || permission !== 'granted') return;
    log.debug('Setting up real-time subscription');
    const channel = supabase
      .channel('security-alerts-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_alerts' }, (payload) => {
        log.info('New alert received', { id: (payload.new as SecurityAlert).id });
        const alert = payload.new as SecurityAlert;
        const { title, options } = formatAlertNotification(alert);
        showNotification(title, options);
        const toastVariant = alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info';
        toast[toastVariant === 'error' ? 'error' : toastVariant === 'warning' ? 'warning' : 'info'](alert.title, { description: alert.description });
      })
      .subscribe((status) => { log.debug('Subscription status', { status }); });
    return () => { log.debug('Cleaning up subscription'); supabase.removeChannel(channel); };
  }, [user, permission, showNotification, formatAlertNotification]);

  useEffect(() => {
    if (!user || permission !== 'granted') return;
    const channel = supabase.channel('blocked-access-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blocked_access_logs' }, (payload) => {
        log.info('Blocked access detected', { ip: (payload.new as { ip_address: string }).ip_address });
        const logEntry = payload.new as { id: string; ip_address: string; user_email?: string; city?: string; country?: string; reason: string };
        const location = logEntry.city && logEntry.country ? `${logEntry.city}, ${logEntry.country}` : logEntry.country || 'Localização desconhecida';
        showNotification('🚫 Acesso Bloqueado', { body: `IP: ${logEntry.ip_address}\nLocalização: ${location}\nMotivo: ${logEntry.reason}`, tag: `blocked-access-${logEntry.id}` });
        toast.error('Acesso bloqueado detectado', { description: `IP ${logEntry.ip_address} de ${location}` });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, permission, showNotification]);

  useEffect(() => {
    if (!user || permission !== 'granted') return;
    const channel = supabase.channel('rate-limit-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rate_limit_alerts' }, (payload) => {
        log.info('Rate limit alert', { ip: (payload.new as { ip_address: string }).ip_address });
        const alert = payload.new as { id: string; ip_address: string; endpoint: string; request_count: number; severity: string };
        showNotification('⚡ Rate Limit Excedido', { body: `IP: ${alert.ip_address}\nEndpoint: ${alert.endpoint}\nRequests: ${alert.request_count}`, tag: `rate-limit-${alert.id}` });
        toast.warning('Rate limit excedido', { description: `${alert.request_count} requisições de ${alert.ip_address}` });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, permission, showNotification]);

  return { isSupported, permission, requestPermission, showNotification };
}
