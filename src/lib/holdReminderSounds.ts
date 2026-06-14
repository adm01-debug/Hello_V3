/**
 * Audio utilities for hold reminder notifications.
 */

export function createNotificationSound() {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

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
}

export function createUrgentSound() {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

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
}

export function formatHoldTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// localStorage helpers
const STORAGE_KEY_INTERVAL = 'holdReminder_interval';
const STORAGE_KEY_ENABLED = 'holdReminder_enabled';
const STORAGE_KEY_ALERT_THRESHOLD = 'holdReminder_alertThreshold';
const STORAGE_KEY_ALERTS_ENABLED = 'holdReminder_alertsEnabled';

export type ReminderInterval = 15 | 30 | 60;
export type HoldAlertThreshold = 30 | 60 | 120 | 180 | 300;

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

export function loadSavedInterval(): ReminderInterval {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_INTERVAL);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed === 15 || parsed === 30 || parsed === 60) return parsed;
    }
  } catch { /* noop */ }
  return 30;
}

export function loadSavedEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (saved !== null) return saved === 'true';
  } catch { /* noop */ }
  return true;
}

export function loadSavedAlertThreshold(): HoldAlertThreshold {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ALERT_THRESHOLD);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if ([30, 60, 120, 180, 300].includes(parsed)) return parsed as HoldAlertThreshold;
    }
  } catch { /* noop */ }
  return 60;
}

export function loadSavedAlertsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ALERTS_ENABLED);
    if (saved !== null) return saved === 'true';
  } catch { /* noop */ }
  return true;
}

export function saveToStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

export { STORAGE_KEY_INTERVAL, STORAGE_KEY_ENABLED, STORAGE_KEY_ALERT_THRESHOLD, STORAGE_KEY_ALERTS_ENABLED };
