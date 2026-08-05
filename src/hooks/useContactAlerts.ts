import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ContactAlert {
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
}

export const useContactAlerts = () => {
  const [alerts, setAlerts] = useState<ContactAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = useCallback(async (unreadOnly = false) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('contact_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []) as unknown as ContactAlert[];
      setAlerts(typedData);
      setUnreadCount(typedData.filter(a => !a.is_read).length);
      return typedData;
    } catch (err) {
      logger.error('Error fetching contact alerts:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('contact_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('Error marking alert as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('contact_alerts')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
      
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
      toast.success('Todos os alertas marcados como lidos');
    } catch (err) {
      logger.error('Error marking all as read:', err);
    }
  }, []);

  const markAsActioned = useCallback(async (alertId: string, actionedBy?: string) => {
    try {
      const { error } = await supabase
        .from('contact_alerts')
        .update({ 
          is_actioned: true, 
          actioned_at: new Date().toISOString(),
          actioned_by: actionedBy || 'Usuário'
        })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_actioned: true, actioned_at: new Date().toISOString() } : a
      ));
      toast.success('Alerta marcado como resolvido');
    } catch (err) {
      logger.error('Error marking alert as actioned:', err);
    }
  }, []);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('contact_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta removido');
    } catch (err) {
      logger.error('Error deleting alert:', err);
    }
  }, []);

  const checkForNewAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-contact-alerts');
      
      if (error) throw error;
      
      if (data?.alerts_created > 0) {
        toast.info(`${data.alerts_created} novos alertas gerados`);
        await fetchAlerts();
      }
      
      return data;
    } catch (err) {
      logger.error('Error checking for new alerts:', err);
      return null;
    }
  }, [fetchAlerts]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('contact-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_alerts'
        },
        (payload) => {
          const newAlert = payload.new as ContactAlert;
          setAlerts(prev => [newAlert, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new alerts
          toast(newAlert.title, {
            description: newAlert.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  return {
    alerts,
    unreadCount,
    isLoading,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    markAsActioned,
    deleteAlert,
    checkForNewAlerts
  };
};
