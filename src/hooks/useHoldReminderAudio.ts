// Audio utilities extracted from useHoldReminder

export const createNotificationSound = () => {
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

    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 523.25;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.5);
    }, 200);
  };
};

export const createUrgentSound = () => {
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

export const formatHoldTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

// localStorage helpers
const STORAGE_KEYS = {
  INTERVAL: 'holdReminder_interval',
  ENABLED: 'holdReminder_enabled',
  ALERT_THRESHOLD: 'holdReminder_alertThreshold',
  ALERTS_ENABLED: 'holdReminder_alertsEnabled',
} as const;

export const loadSavedInterval = (): 15 | 30 | 60 => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.INTERVAL);
    if (saved) { const p = parseInt(saved, 10); if (p === 15 || p === 30 || p === 60) return p; }
  } catch { /* ignore */ }
  return 30;
};

export const loadSavedEnabled = (): boolean => {
  try { const s = localStorage.getItem(STORAGE_KEYS.ENABLED); if (s !== null) return s === 'true'; } catch { /* ignore */ }
  return true;
};

export const loadSavedAlertThreshold = (): 30 | 60 | 120 | 180 | 300 => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERT_THRESHOLD);
    if (saved) { const p = parseInt(saved, 10); if ([30, 60, 120, 180, 300].includes(p)) return p as any; }
  } catch { /* ignore */ }
  return 60;
};

export const loadSavedAlertsEnabled = (): boolean => {
  try { const s = localStorage.getItem(STORAGE_KEYS.ALERTS_ENABLED); if (s !== null) return s === 'true'; } catch { /* ignore */ }
  return true;
};

export const saveToStorage = (key: keyof typeof STORAGE_KEYS, value: string) => {
  try { localStorage.setItem(STORAGE_KEYS[key], value); } catch { /* ignore */ }
};
