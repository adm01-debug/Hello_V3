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

export interface AlertSoundConfig {
  warningFrequency: number;
  warningPattern: 'single' | 'double' | 'triple';
  warningVolume: number;
  criticalFrequency: number;
  criticalPattern: 'single' | 'double' | 'triple' | 'urgent';
  criticalVolume: number;
}

const DEFAULT_SOUND_CONFIG: AlertSoundConfig = {
  warningFrequency: 520,
  warningPattern: 'single',
  warningVolume: 0.2,
  criticalFrequency: 880,
  criticalPattern: 'urgent',
  criticalVolume: 0.3,
};

interface UseCriticalAlertNotificationsOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  browserNotificationsEnabled?: boolean;
  soundConfig?: AlertSoundConfig;
}

export const useCriticalAlertNotifications = (options: UseCriticalAlertNotificationsOptions = {}) => {
  const { 
    enabled = true, 
    soundEnabled = true, 
    browserNotificationsEnabled = true,
    soundConfig = DEFAULT_SOUND_CONFIG,
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

  // Play beep pattern based on configuration
  const playBeepPattern = useCallback((
    audioContext: AudioContext,
    frequency: number,
    volume: number,
    pattern: 'single' | 'double' | 'triple' | 'urgent'
  ) => {
    const beepDuration = 0.15;
    const gapDuration = 0.1;
    
    const playBeep = (startTime: number, freq: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, startTime);
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + beepDuration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + beepDuration);
    };

    const currentTime = audioContext.currentTime;

    switch (pattern) {
      case 'single':
        playBeep(currentTime, frequency);
        break;
      case 'double':
        playBeep(currentTime, frequency);
        playBeep(currentTime + beepDuration + gapDuration, frequency);
        break;
      case 'triple':
        playBeep(currentTime, frequency);
        playBeep(currentTime + beepDuration + gapDuration, frequency);
        playBeep(currentTime + 2 * (beepDuration + gapDuration), frequency);
        break;
      case 'urgent':
        // Alternating high-low pattern
        playBeep(currentTime, frequency);
        playBeep(currentTime + beepDuration + gapDuration, frequency * 0.75);
        playBeep(currentTime + 2 * (beepDuration + gapDuration), frequency);
        playBeep(currentTime + 3 * (beepDuration + gapDuration), frequency * 0.75);
        break;
    }
  }, []);

  // Play alert sound using Web Audio API with configurable settings
  const playAlertSound = useCallback((severity: 'warning' | 'critical') => {
    if (!soundEnabled) return;

    try {
      const audioContext = initAudioContext();
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (severity === 'critical') {
        playBeepPattern(
          audioContext,
          soundConfig.criticalFrequency,
          soundConfig.criticalVolume,
          soundConfig.criticalPattern
        );
      } else {
        playBeepPattern(
          audioContext,
          soundConfig.warningFrequency,
          soundConfig.warningVolume,
          soundConfig.warningPattern
        );
      }
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }, [soundEnabled, initAudioContext, playBeepPattern, soundConfig]);

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
    defaultSoundConfig: DEFAULT_SOUND_CONFIG,
  };
};
