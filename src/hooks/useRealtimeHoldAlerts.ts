import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('RealtimeHoldAlerts');

interface RealtimeHoldAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  alert_type: string;
  call_session_id: string;
  created_at: string;
  is_read: boolean;
}

const STORAGE_KEY_NOTIFICATIONS_ENABLED = 'realtimeHoldAlerts_enabled';

const loadSavedEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS_ENABLED);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch {
    log.warn('Failed to load notifications enabled state from localStorage');
  }
  return true;
};

// Create urgent notification sound
const createUrgentSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  return () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      }, i * 200);
    }
  };
};

export function useRealtimeHoldAlerts() {
  const [isEnabled, setIsEnabled] = useState(loadSavedEnabled);
  const [browserNotificationsGranted, setBrowserNotificationsGranted] = useState(false);
   const [recentAlerts, setRecentAlerts] = useState<RealtimeHoldAlert[]>(() => {
     try {
       const saved = localStorage.getItem('recentHoldAlerts');
       return saved ? JSON.parse(saved) : [];
     } catch { return []; }
   });
  const [unreadCount, setUnreadCount] = useState(0);
  const [playSoundRef] = useState<{ current: (() => void) | null }>({ current: null });

  useEffect(() => {
    if ('Notification' in window) {
      setBrowserNotificationsGranted(Notification.permission === 'granted');
    }
  }, []);

  const requestBrowserNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error("Notificações não suportadas", { description: "Seu navegador não suporta notificações nativas." });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationsGranted(granted);
      
      if (granted) {
        toast.success("Notificações ativadas", { description: "Você receberá alertas críticos de espera em tempo real." });
      } else {
        toast.error("Permissão negada", { description: "Você não receberá notificações nativas do navegador." });
      }
      
      return granted;
    } catch (error) {
      log.warn('Failed to request notification permission', error);
      return false;
    }
  }, []);

  const sendBrowserNotification = useCallback((alert: RealtimeHoldAlert) => {
    if (!browserNotificationsGranted || Notification.permission !== 'granted') return;

    const isCritical = alert.severity === 'critical' || alert.severity === 'error';

    try {
      const notification = new Notification(
        isCritical ? '🚨 Alerta Crítico de Espera' : '⚠️ Alerta de Tempo em Espera',
        {
          body: alert.message,
          icon: '/favicon.ico',
          tag: `hold-alert-${alert.id}`,
          requireInteraction: isCritical,
        }
      );

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      if (!isCritical) {
        setTimeout(() => notification.close(), 10000);
      }
    } catch (error) {
      log.warn('Failed to send browser notification', error);
    }
  }, [browserNotificationsGranted]);

  const showToastNotification = useCallback((alert: RealtimeHoldAlert) => {
    const isCritical = alert.severity === 'critical' || alert.severity === 'error';
    
    if (isCritical) {
      toast.error(isCritical ? "🚨 Alerta Crítico de Espera" : "⚠️ Alerta de Tempo em Espera", { description: alert.message, duration: isCritical ? 10000 : 7000 });
    } else {
      toast.warning("⚠️ Alerta de Tempo em Espera", { description: alert.message, duration: 7000 });
    }
  }, []);

  const initAudio = useCallback(() => {
    if (!playSoundRef.current) {
      playSoundRef.current = createUrgentSound();
    }
  }, [playSoundRef]);

   const handleNewAlert = useCallback((alert: RealtimeHoldAlert) => {
     setRecentAlerts(prev => {
       const exists = prev.some(a => a.id === alert.id);
       if (exists) return prev;
       const next = [alert, ...prev].slice(0, 50);
       localStorage.setItem('recentHoldAlerts', JSON.stringify(next));
       return next;
     });
 
     if (!isEnabled) return;
 
     log.info('New hold alert received', { id: alert.id, severity: alert.severity });
     setUnreadCount(prev => prev + 1);

    const isCritical = alert.severity === 'critical' || alert.severity === 'error';

    if (isCritical) {
      initAudio();
      if (playSoundRef.current) {
        try {
          playSoundRef.current();
        } catch (error) {
          log.warn('Audio playback failed', error);
        }
      }
    }

    showToastNotification(alert);
    sendBrowserNotification(alert);
  }, [isEnabled, initAudio, playSoundRef, showToastNotification, sendBrowserNotification]);

  useEffect(() => {
    if (!isEnabled) return;

    log.debug('Subscribing to realtime hold alerts');

    const channel = supabase
      .channel('hold-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_alerts',
          filter: 'alert_type=eq.hold_time_exceeded'
        },
        (payload) => {
          log.debug('Realtime alert payload received');
          const alert = payload.new as RealtimeHoldAlert;
          handleNewAlert(alert);
        }
      )
      .subscribe((status) => {
        log.debug('Realtime subscription status', { status });
      });

    return () => {
      log.debug('Unsubscribing from realtime hold alerts');
      supabase.removeChannel(channel);
    };
  }, [isEnabled, handleNewAlert]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('call_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_type', 'hold_time_exceeded')
        .eq('is_read', false);
      
      if (count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();
  }, []);

  const toggleNotifications = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS_ENABLED, String(newValue));
      } catch {
        log.warn('Failed to save notifications enabled state to localStorage');
      }
      
      if (newValue) {
        toast.success("Notificações ativadas", { description: "Você receberá alertas de espera em tempo real." });
      } else {
        toast("Notificações desativadas", { description: "Você não receberá mais alertas em tempo real." });
      }
      
      return newValue;
    });
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from('call_alerts')
      .update({ is_read: true })
      .eq('alert_type', 'hold_time_exceeded')
      .eq('is_read', false);
    
    if (!error) {
      setUnreadCount(0);
      setRecentAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    }
  }, []);

  return {
    isEnabled,
    toggleNotifications,
    browserNotificationsGranted,
    requestBrowserNotifications,
    recentAlerts,
    unreadCount,
    clearUnreadCount,
    markAllAsRead,
  };
}
