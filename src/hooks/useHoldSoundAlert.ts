import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HoldAlertSettings {
  warning_threshold_seconds: number;
  critical_threshold_seconds: number;
  notify_on_warning: boolean;
  notify_on_critical: boolean;
  enabled: boolean;
}

const DEFAULT_SETTINGS: HoldAlertSettings = {
  warning_threshold_seconds: 60,
  critical_threshold_seconds: 180,
  notify_on_warning: true,
  notify_on_critical: true,
  enabled: true,
};

// Create warning sound (lower frequency, single beep)
const createWarningSound = (audioContext: AudioContext) => {
  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440; // A4 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };
};

// Create critical sound (higher frequency, multiple urgent beeps)
const createCriticalSound = (audioContext: AudioContext) => {
  return () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880; // A5 note - higher pitch
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      }, i * 200);
    }
  };
};

export function useHoldSoundAlert(activeHolds: Array<{ id: string; call_session_id: string | null; started_at: string }>) {
  const [settings, setSettings] = useState<HoldAlertSettings>(DEFAULT_SETTINGS);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('holdSoundAlert_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const playWarningRef = useRef<(() => void) | null>(null);
  const playCriticalRef = useRef<(() => void) | null>(null);
  
  // Track which holds have already triggered alerts to avoid repeating
  const warnedHoldsRef = useRef<Set<string>>(new Set());
  const criticalHoldsRef = useRef<Set<string>>(new Set());

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('hold_alert_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSettings(data);
      }
    };

    fetchSettings();

    // Subscribe to settings changes
    const channel = supabase
      .channel('hold-sound-settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hold_alert_settings'
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      playWarningRef.current = createWarningSound(audioContextRef.current);
      playCriticalRef.current = createCriticalSound(audioContextRef.current);
    }
    
    // Resume audio context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Check hold durations and play sounds
  useEffect(() => {
    if (!soundEnabled || !settings.enabled) return;

    const checkHolds = () => {
      const now = Date.now();
      
      activeHolds.forEach(hold => {
        const holdDuration = Math.floor((now - new Date(hold.started_at).getTime()) / 1000);
        const holdId = hold.id;
        
        // Check for critical threshold
        if (
          settings.notify_on_critical &&
          holdDuration >= settings.critical_threshold_seconds &&
          !criticalHoldsRef.current.has(holdId)
        ) {
          criticalHoldsRef.current.add(holdId);
          warnedHoldsRef.current.add(holdId); // Also mark as warned to prevent warning after critical
          
          initAudio();
          if (playCriticalRef.current) {
            try {
              playCriticalRef.current();
              console.log(`Critical hold alert: ${holdId} - ${holdDuration}s`);
            } catch (error) {
              console.log('Failed to play critical sound:', error);
            }
          }
        }
        // Check for warning threshold (only if not already critical)
        else if (
          settings.notify_on_warning &&
          holdDuration >= settings.warning_threshold_seconds &&
          holdDuration < settings.critical_threshold_seconds &&
          !warnedHoldsRef.current.has(holdId)
        ) {
          warnedHoldsRef.current.add(holdId);
          
          initAudio();
          if (playWarningRef.current) {
            try {
              playWarningRef.current();
              console.log(`Warning hold alert: ${holdId} - ${holdDuration}s`);
            } catch (error) {
              console.log('Failed to play warning sound:', error);
            }
          }
        }
      });
      
      // Clean up holds that are no longer active
      const activeHoldIds = new Set(activeHolds.map(h => h.id));
      warnedHoldsRef.current.forEach(id => {
        if (!activeHoldIds.has(id)) {
          warnedHoldsRef.current.delete(id);
        }
      });
      criticalHoldsRef.current.forEach(id => {
        if (!activeHoldIds.has(id)) {
          criticalHoldsRef.current.delete(id);
        }
      });
    };

    // Check immediately
    checkHolds();

    // Then check every second
    const interval = setInterval(checkHolds, 1000);

    return () => clearInterval(interval);
  }, [activeHolds, settings, soundEnabled, initAudio]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('holdSoundAlert_enabled', String(newValue));
      return newValue;
    });
  }, []);

  // Test sound function
  const testSound = useCallback((type: 'warning' | 'critical') => {
    initAudio();
    if (type === 'warning' && playWarningRef.current) {
      playWarningRef.current();
    } else if (type === 'critical' && playCriticalRef.current) {
      playCriticalRef.current();
    }
  }, [initAudio]);

  return {
    soundEnabled,
    toggleSound,
    testSound,
    settings,
  };
}
