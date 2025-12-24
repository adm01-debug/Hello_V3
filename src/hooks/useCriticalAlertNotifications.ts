import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CriticalAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  alert_type: string;
  created_at: string;
}

interface UseCriticalAlertNotificationsOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  browserNotificationsEnabled?: boolean;
}

export const useCriticalAlertNotifications = (options: UseCriticalAlertNotificationsOptions = {}) => {
  const { 
    enabled = true, 
    soundEnabled = true, 
    browserNotificationsEnabled = true 
  } = options;
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAlertIdRef = useRef<string | null>(null);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Initialize audio context on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Play alert sound using Web Audio API
  const playAlertSound = useCallback((severity: 'warning' | 'critical') => {
    if (!soundEnabled) return;

    try {
      const audioContext = initAudioContext();
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different severities
      if (severity === 'critical') {
        // Urgent beep pattern for critical
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } else {
        // Single beep for warning
        oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }, [soundEnabled, initAudioContext]);

  // Show browser notification
  const showBrowserNotification = useCallback((alert: CriticalAlert) => {
    if (!browserNotificationsEnabled || notificationPermission !== 'granted') return;

    try {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: alert.severity === 'critical' ? '🚨' : '⚠️',
        tag: alert.id,
        requireInteraction: alert.severity === 'critical',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds for non-critical
      if (alert.severity !== 'critical') {
        setTimeout(() => notification.close(), 10000);
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, [browserNotificationsEnabled, notificationPermission]);

  // Show toast notification
  const showToastNotification = useCallback((alert: CriticalAlert) => {
    const isCritical = alert.severity === 'critical';
    
    if (isCritical) {
      toast.error(alert.title, {
        description: alert.message,
        duration: 10000,
        action: {
          label: 'Ver',
          onClick: () => {
            window.location.href = '/alerts';
          },
        },
      });
    } else {
      toast.warning(alert.title, {
        description: alert.message,
        duration: 5000,
      });
    }
  }, []);

  // Handle new alert
  const handleNewAlert = useCallback((alert: CriticalAlert) => {
    // Prevent duplicate notifications for the same alert
    if (lastAlertIdRef.current === alert.id) return;
    lastAlertIdRef.current = alert.id;

    console.log('New critical alert received:', alert);

    // Play sound based on severity
    if (alert.severity === 'critical' || alert.severity === 'warning') {
      playAlertSound(alert.severity as 'warning' | 'critical');
    }

    // Show toast notification
    showToastNotification(alert);

    // Show browser notification
    showBrowserNotification(alert);
  }, [playAlertSound, showToastNotification, showBrowserNotification]);

  // Subscribe to real-time alerts
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('critical-alerts-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_alerts',
          filter: 'severity=in.(warning,critical)',
        },
        (payload) => {
          const alert = payload.new as CriticalAlert;
          handleNewAlert(alert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, handleNewAlert]);

  // Request notification permission on mount
  useEffect(() => {
    if (browserNotificationsEnabled && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [browserNotificationsEnabled]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    notificationPermission,
    requestNotificationPermission,
    playAlertSound,
    initAudioContext,
  };
};
