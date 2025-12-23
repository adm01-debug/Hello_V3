import { useEffect, useRef, useCallback, useState } from 'react';
import { CallSession } from './useMultiChannelCall';
import { toast } from '@/hooks/use-toast';

export type ReminderInterval = 15 | 30 | 60;
export type HoldAlertThreshold = 30 | 60 | 120 | 180 | 300;

const STORAGE_KEY_INTERVAL = 'holdReminder_interval';
const STORAGE_KEY_ENABLED = 'holdReminder_enabled';
const STORAGE_KEY_ALERT_THRESHOLD = 'holdReminder_alertThreshold';
const STORAGE_KEY_ALERTS_ENABLED = 'holdReminder_alertsEnabled';

export const REMINDER_INTERVALS: { value: ReminderInterval; label: string }[] = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
];

export const ALERT_THRESHOLDS: { value: HoldAlertThreshold; label: string }[] = [
  { value: 30, label: '30s' },
  { value: 60, label: '1min' },
  { value: 120, label: '2min' },
  { value: 180, label: '3min' },
  { value: 300, label: '5min' },
];

export interface HoldAlert {
  callId: string;
  callName: string;
  holdTime: number;
  threshold: number;
  triggeredAt: Date;
  severity: 'warning' | 'critical';
}

// Load saved preferences from localStorage
const loadSavedInterval = (): ReminderInterval => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_INTERVAL);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed === 15 || parsed === 30 || parsed === 60) {
        return parsed;
      }
    }
  } catch (e) {
    console.log('Failed to load interval from localStorage');
  }
  return 30;
};

const loadSavedEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch (e) {
    console.log('Failed to load enabled state from localStorage');
  }
  return true;
};

const loadSavedAlertThreshold = (): HoldAlertThreshold => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ALERT_THRESHOLD);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if ([30, 60, 120, 180, 300].includes(parsed)) {
        return parsed as HoldAlertThreshold;
      }
    }
  } catch (e) {
    console.log('Failed to load alert threshold from localStorage');
  }
  return 60;
};

const loadSavedAlertsEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ALERTS_ENABLED);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch (e) {
    console.log('Failed to load alerts enabled state from localStorage');
  }
  return true;
};

// Create notification sound using Web Audio API
const createNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Second beep
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 523.25; // C5
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.5);
    }, 200);
  };
};

// Create urgent alert sound
const createUrgentSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  return () => {
    // Three rapid beeps for urgent alert
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880; // Higher pitch for urgency
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      }, i * 200);
    }
  };
};

export function useHoldReminder(activeCalls: CallSession[]) {
  const [isEnabled, setIsEnabled] = useState(loadSavedEnabled);
  const [interval, setInterval] = useState<ReminderInterval>(loadSavedInterval);
  const [alertThreshold, setAlertThreshold] = useState<HoldAlertThreshold>(loadSavedAlertThreshold);
  const [alertsEnabled, setAlertsEnabled] = useState(loadSavedAlertsEnabled);
  const [activeAlerts, setActiveAlerts] = useState<HoldAlert[]>([]);
  const [lastReminderTime, setLastReminderTime] = useState<Record<string, number>>({});
  const [alertedCalls, setAlertedCalls] = useState<Record<string, { warning: boolean; critical: boolean }>>({});
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const playSoundRef = useRef<(() => void) | null>(null);
  const playUrgentSoundRef = useRef<(() => void) | null>(null);
  
  const intervalMs = interval * 1000;

  // Check browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Request browser notification permission
  const requestBrowserNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações nativas.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationsEnabled(granted);
      
      if (granted) {
        toast({
          title: "Notificações ativadas",
          description: "Você receberá alertas críticos de espera no navegador.",
        });
      } else {
        toast({
          title: "Permissão negada",
          description: "Você não receberá notificações nativas do navegador.",
          variant: "destructive",
        });
      }
      
      return granted;
    } catch (error) {
      console.log('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // Send browser notification for critical alerts
  const sendBrowserNotification = useCallback((alert: HoldAlert) => {
    if (!browserNotificationsEnabled || Notification.permission !== 'granted') return;

    try {
      const notification = new Notification(
        alert.severity === 'critical' 
          ? '🚨 Alerta Crítico de Espera' 
          : '⚠️ Alerta de Tempo em Espera',
        {
          body: `${alert.callName} está em espera há ${formatHoldTime(alert.holdTime)}${alert.severity === 'critical' ? ' - Atenção urgente necessária!' : ''}`,
          icon: '/favicon.ico',
          tag: `hold-alert-${alert.callId}`,
          requireInteraction: alert.severity === 'critical',
        }
      );

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close non-critical after 10s
      if (alert.severity !== 'critical') {
        setTimeout(() => notification.close(), 10000);
      }
    } catch (error) {
      console.log('Failed to send browser notification:', error);
    }
  }, [browserNotificationsEnabled]);

  // Initialize audio on first user interaction
  const initAudio = useCallback(() => {
    if (!playSoundRef.current) {
      playSoundRef.current = createNotificationSound();
    }
    if (!playUrgentSoundRef.current) {
      playUrgentSoundRef.current = createUrgentSound();
    }
  }, []);

  const formatHoldTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const showVisualNotification = useCallback((callsOnHold: CallSession[]) => {
    const callNames = callsOnHold
      .map(call => call.contactName || call.phoneNumber || 'Chamada')
      .join(', ');
    
    toast({
      title: "📞 Chamada em espera",
      description: callsOnHold.length === 1 
        ? `${callNames} aguardando atenção`
        : `${callsOnHold.length} chamadas aguardando: ${callNames}`,
      variant: "default",
      duration: 5000,
    });
  }, []);

  const showThresholdAlert = useCallback((alert: HoldAlert) => {
    const isCritical = alert.severity === 'critical';
    
    toast({
      title: isCritical ? "🚨 Alerta Crítico de Espera" : "⚠️ Alerta de Tempo em Espera",
      description: `${alert.callName} está em espera há ${formatHoldTime(alert.holdTime)}${isCritical ? ' - Atenção urgente necessária!' : ''}`,
      variant: isCritical ? "destructive" : "default",
      duration: isCritical ? 10000 : 7000,
    });
  }, []);

  // Check for hold time threshold alerts
  const checkHoldAlerts = useCallback(() => {
    if (!alertsEnabled) return;

    const callsOnHold = activeCalls.filter(call => call.isOnHold);
    const newAlerts: HoldAlert[] = [];
    const newAlertedCalls = { ...alertedCalls };

    callsOnHold.forEach(call => {
      const holdTime = call.totalHoldTime;
      const callName = call.contactName || call.phoneNumber || 'Chamada';
      const callAlerts = newAlertedCalls[call.id] || { warning: false, critical: false };
      
      // Critical alert: 2x the threshold
      const criticalThreshold = alertThreshold * 2;
      
      if (holdTime >= criticalThreshold && !callAlerts.critical) {
        const alert: HoldAlert = {
          callId: call.id,
          callName,
          holdTime,
          threshold: criticalThreshold,
          triggeredAt: new Date(),
          severity: 'critical'
        };
        newAlerts.push(alert);
        newAlertedCalls[call.id] = { ...callAlerts, critical: true };
        
        // Play urgent sound
        if (playUrgentSoundRef.current) {
          try {
            playUrgentSoundRef.current();
          } catch (error) {
            console.log('Urgent audio playback failed:', error);
          }
        }
        
        // Send browser notification for critical alerts
        sendBrowserNotification(alert);
        
        showThresholdAlert(alert);
      } else if (holdTime >= alertThreshold && !callAlerts.warning) {
        // Warning alert: at the threshold
        const alert: HoldAlert = {
          callId: call.id,
          callName,
          holdTime,
          threshold: alertThreshold,
          triggeredAt: new Date(),
          severity: 'warning'
        };
        newAlerts.push(alert);
        newAlertedCalls[call.id] = { ...callAlerts, warning: true };
        
        // Play regular sound
        if (playSoundRef.current) {
          try {
            playSoundRef.current();
          } catch (error) {
            console.log('Audio playback failed:', error);
          }
        }
        
        showThresholdAlert(alert);
      }
    });

    if (newAlerts.length > 0) {
      setActiveAlerts(prev => [...prev, ...newAlerts].slice(-20)); // Keep last 20 alerts
    }
    
    setAlertedCalls(newAlertedCalls);
  }, [activeCalls, alertsEnabled, alertThreshold, alertedCalls, showThresholdAlert, sendBrowserNotification]);

  const playHoldReminder = useCallback(() => {
    if (!isEnabled) return;
    
    // Initialize audio if needed
    initAudio();
    
    const callsOnHold = activeCalls.filter(call => call.isOnHold);
    
    if (callsOnHold.length === 0) return;
    
    const now = Date.now();
    const newLastReminderTime = { ...lastReminderTime };
    let shouldNotify = false;
    
    callsOnHold.forEach(call => {
      const lastReminder = lastReminderTime[call.id] || 0;
      if (now - lastReminder >= intervalMs) {
        shouldNotify = true;
        newLastReminderTime[call.id] = now;
      }
    });
    
    if (shouldNotify) {
      // Play sound
      if (playSoundRef.current) {
        try {
          playSoundRef.current();
        } catch (error) {
          console.log('Audio playback failed:', error);
        }
      }
      
      // Show visual notification
      showVisualNotification(callsOnHold);
    }
    
    setLastReminderTime(newLastReminderTime);
  }, [activeCalls, isEnabled, lastReminderTime, initAudio, intervalMs, showVisualNotification]);

  // Check for calls on hold every second
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      playHoldReminder();
      checkHoldAlerts();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playHoldReminder, checkHoldAlerts]);

  // Clean up reminder times and alerted calls for ended calls
  useEffect(() => {
    const activeCallIds = new Set(activeCalls.map(c => c.id));
    
    setLastReminderTime(prev => {
      const cleaned: Record<string, number> = {};
      Object.entries(prev).forEach(([id, time]) => {
        if (activeCallIds.has(id)) {
          cleaned[id] = time;
        }
      });
      return cleaned;
    });

    setAlertedCalls(prev => {
      const cleaned: Record<string, { warning: boolean; critical: boolean }> = {};
      Object.entries(prev).forEach(([id, alerts]) => {
        if (activeCallIds.has(id)) {
          cleaned[id] = alerts;
        }
      });
      return cleaned;
    });

    // Reset alerts for calls that are no longer on hold
    setActiveAlerts(prev => prev.filter(alert => {
      const call = activeCalls.find(c => c.id === alert.callId);
      return call && call.isOnHold;
    }));
  }, [activeCalls]);

  const toggleReminder = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_ENABLED, String(newValue));
      } catch (e) {
        console.log('Failed to save enabled state to localStorage');
      }
      return newValue;
    });
  }, []);

  const toggleAlerts = useCallback(() => {
    setAlertsEnabled(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_ALERTS_ENABLED, String(newValue));
      } catch (e) {
        console.log('Failed to save alerts enabled state to localStorage');
      }
      return newValue;
    });
  }, []);

  const changeInterval = useCallback((newInterval: ReminderInterval) => {
    setInterval(newInterval);
    try {
      localStorage.setItem(STORAGE_KEY_INTERVAL, String(newInterval));
    } catch (e) {
      console.log('Failed to save interval to localStorage');
    }
    // Reset reminder times so the new interval takes effect immediately
    setLastReminderTime({});
  }, []);

  const changeAlertThreshold = useCallback((newThreshold: HoldAlertThreshold) => {
    setAlertThreshold(newThreshold);
    try {
      localStorage.setItem(STORAGE_KEY_ALERT_THRESHOLD, String(newThreshold));
    } catch (e) {
      console.log('Failed to save alert threshold to localStorage');
    }
    // Reset alerted calls so new threshold takes effect
    setAlertedCalls({});
  }, []);

  const clearAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  const getCallsOnHold = useCallback(() => {
    return activeCalls.filter(call => call.isOnHold);
  }, [activeCalls]);

  return {
    isEnabled,
    interval,
    alertThreshold,
    alertsEnabled,
    activeAlerts,
    browserNotificationsEnabled,
    toggleReminder,
    toggleAlerts,
    changeInterval,
    changeAlertThreshold,
    clearAlerts,
    requestBrowserNotifications,
    callsOnHold: getCallsOnHold(),
    initAudio
  };
}