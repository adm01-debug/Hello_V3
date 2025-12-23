import { useEffect, useRef, useCallback, useState } from 'react';
import { CallSession } from './useMultiChannelCall';
import { toast } from '@/hooks/use-toast';

export type ReminderInterval = 15 | 30 | 60;

const STORAGE_KEY_INTERVAL = 'holdReminder_interval';
const STORAGE_KEY_ENABLED = 'holdReminder_enabled';

export const REMINDER_INTERVALS: { value: ReminderInterval; label: string }[] = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
];

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

export function useHoldReminder(activeCalls: CallSession[]) {
  const [isEnabled, setIsEnabled] = useState(loadSavedEnabled);
  const [interval, setInterval] = useState<ReminderInterval>(loadSavedInterval);
  const [lastReminderTime, setLastReminderTime] = useState<Record<string, number>>({});
  const intervalRef = useRef<number | null>(null);
  const playSoundRef = useRef<(() => void) | null>(null);
  
  const intervalMs = interval * 1000;

  // Initialize audio on first user interaction
  const initAudio = useCallback(() => {
    if (!playSoundRef.current) {
      playSoundRef.current = createNotificationSound();
    }
  }, []);

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
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playHoldReminder]);

  // Clean up reminder times for ended calls
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

  const getCallsOnHold = useCallback(() => {
    return activeCalls.filter(call => call.isOnHold);
  }, [activeCalls]);

  return {
    isEnabled,
    interval,
    toggleReminder,
    changeInterval,
    callsOnHold: getCallsOnHold(),
    initAudio
  };
}
