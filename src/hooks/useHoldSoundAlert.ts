import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('HoldSoundAlert');

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

const createWarningSound = (audioContext: AudioContext) => {
  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };
};

const createCriticalSound = (audioContext: AudioContext) => {
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

export function useHoldSoundAlert(activeHolds: Array<{ id: string; call_session_id: string | null; started_at: string }>) {
  const [settings, setSettings] = useState<HoldAlertSettings>(DEFAULT_SETTINGS);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('holdSoundAlert_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const playWarningRef = useRef<(() => void) | null>(null);
  const playCriticalRef = useRef<(() => void) | null>(null);
  const warnedHoldsRef = useRef<Set<string>>(new Set());
  const criticalHoldsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('hold_alert_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (!error && data) setSettings(data);
    };
    fetchSettings();

    const channel = supabase
      .channel('hold-sound-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hold_alert_settings' }, () => { fetchSettings(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      playWarningRef.current = createWarningSound(audioContextRef.current);
      playCriticalRef.current = createCriticalSound(audioContextRef.current);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    if (!soundEnabled || !settings.enabled) return;

    const checkHolds = () => {
      const now = Date.now();
      activeHolds.forEach(hold => {
        const holdDuration = Math.floor((now - new Date(hold.started_at).getTime()) / 1000);
        const holdId = hold.id;
        
        if (settings.notify_on_critical && holdDuration >= settings.critical_threshold_seconds && !criticalHoldsRef.current.has(holdId)) {
          criticalHoldsRef.current.add(holdId);
          warnedHoldsRef.current.add(holdId);
          initAudio();
          if (playCriticalRef.current) {
            try {
              playCriticalRef.current();
              log.info(`Critical hold alert: ${holdId} - ${holdDuration}s`);
            } catch (error) {
              log.warn('Failed to play critical sound', error);
            }
          }
        } else if (settings.notify_on_warning && holdDuration >= settings.warning_threshold_seconds && holdDuration < settings.critical_threshold_seconds && !warnedHoldsRef.current.has(holdId)) {
          warnedHoldsRef.current.add(holdId);
          initAudio();
          if (playWarningRef.current) {
            try {
              playWarningRef.current();
              log.info(`Warning hold alert: ${holdId} - ${holdDuration}s`);
            } catch (error) {
              log.warn('Failed to play warning sound', error);
            }
          }
        }
      });
      
      const activeHoldIds = new Set(activeHolds.map(h => h.id));
      warnedHoldsRef.current.forEach(id => { if (!activeHoldIds.has(id)) warnedHoldsRef.current.delete(id); });
      criticalHoldsRef.current.forEach(id => { if (!activeHoldIds.has(id)) criticalHoldsRef.current.delete(id); });
    };

    checkHolds();
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

  const testSound = useCallback((type: 'warning' | 'critical') => {
    initAudio();
    if (type === 'warning' && playWarningRef.current) playWarningRef.current();
    else if (type === 'critical' && playCriticalRef.current) playCriticalRef.current();
  }, [initAudio]);

  return { soundEnabled, toggleSound, testSound, settings };
}
