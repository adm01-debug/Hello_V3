import { logger } from '@/lib/logger';
const log = logger.create('HoldReminder');
import { useEffect, useRef, useCallback, useState } from 'react';
import { CallSession } from './useMultiChannelCall';
import { toast } from 'sonner';
import {
  createNotificationSound, createUrgentSound, formatHoldTime,
  loadSavedInterval, loadSavedEnabled, loadSavedAlertThreshold, loadSavedAlertsEnabled,
  saveToStorage, STORAGE_KEY_INTERVAL, STORAGE_KEY_ENABLED, STORAGE_KEY_ALERT_THRESHOLD, STORAGE_KEY_ALERTS_ENABLED,
  type ReminderInterval, type HoldAlertThreshold,
} from '@/lib/holdReminderSounds';

// Re-export for consumers
export type { ReminderInterval, HoldAlertThreshold };
export { REMINDER_INTERVALS, ALERT_THRESHOLDS } from '@/lib/holdReminderSounds';

export interface HoldAlert {
  callId: string;
  callName: string;
  holdTime: number;
  threshold: number;
  triggeredAt: Date;
  severity: 'warning' | 'critical';
}

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

  useEffect(() => {
    if ('Notification' in window) setBrowserNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  const requestBrowserNotifications = useCallback(async () => {
    if (!('Notification' in window)) { toast.error("Notificações não suportadas"); return false; }
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationsEnabled(granted);
      granted ? toast.success("Notificações ativadas") : toast.error("Permissão negada");
      return granted;
    } catch { return false; }
  }, []);

  const sendBrowserNotification = useCallback((alert: HoldAlert) => {
    if (!browserNotificationsEnabled || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(
        alert.severity === 'critical' ? '🚨 Alerta Crítico de Espera' : '⚠️ Alerta de Tempo em Espera',
        {
          body: `${alert.callName} está em espera há ${formatHoldTime(alert.holdTime)}`,
          icon: '/favicon.ico', tag: `hold-alert-${alert.callId}`,
          requireInteraction: alert.severity === 'critical',
        }
      );
      n.onclick = () => { window.focus(); n.close(); };
      if (alert.severity !== 'critical') setTimeout(() => n.close(), 10000);
    } catch (e) { log.warn('Failed to send browser notification:', e); }
  }, [browserNotificationsEnabled]);

  const initAudio = useCallback(() => {
    if (!playSoundRef.current) playSoundRef.current = createNotificationSound();
    if (!playUrgentSoundRef.current) playUrgentSoundRef.current = createUrgentSound();
  }, []);

  const showVisualNotification = useCallback((callsOnHold: CallSession[]) => {
    const names = callsOnHold.map(c => c.contactName || c.phoneNumber || 'Chamada').join(', ');
    toast("📞 Chamada em espera", {
      description: callsOnHold.length === 1 ? `${names} aguardando atenção` : `${callsOnHold.length} chamadas aguardando: ${names}`,
      duration: 5000,
    });
  }, []);

  const showThresholdAlert = useCallback((alert: HoldAlert) => {
    const isCritical = alert.severity === 'critical';
    if (isCritical) toast.error("🚨 Alerta Crítico de Espera", { description: `${alert.callName} em espera há ${formatHoldTime(alert.holdTime)}`, duration: 10000 });
    else toast.warning("⚠️ Alerta de Tempo em Espera", { description: `${alert.callName} em espera há ${formatHoldTime(alert.holdTime)}`, duration: 7000 });
  }, []);

  const checkHoldAlerts = useCallback(() => {
    if (!alertsEnabled) return;
    const callsOnHold = activeCalls.filter(c => c.isOnHold);
    const newAlerts: HoldAlert[] = [];
    const newAlertedCalls = { ...alertedCalls };

    callsOnHold.forEach(call => {
      const holdTime = call.totalHoldTime;
      const callName = call.contactName || call.phoneNumber || 'Chamada';
      const callAlerts = newAlertedCalls[call.id] || { warning: false, critical: false };
      const criticalThreshold = alertThreshold * 2;

      if (holdTime >= criticalThreshold && !callAlerts.critical) {
        const a: HoldAlert = { callId: call.id, callName, holdTime, threshold: criticalThreshold, triggeredAt: new Date(), severity: 'critical' };
        newAlerts.push(a); newAlertedCalls[call.id] = { ...callAlerts, critical: true };
        try { playUrgentSoundRef.current?.(); } catch { /* ignore audio playback errors */ }
        sendBrowserNotification(a); showThresholdAlert(a);
      } else if (holdTime >= alertThreshold && !callAlerts.warning) {
        const a: HoldAlert = { callId: call.id, callName, holdTime, threshold: alertThreshold, triggeredAt: new Date(), severity: 'warning' };
        newAlerts.push(a); newAlertedCalls[call.id] = { ...callAlerts, warning: true };
        try { playSoundRef.current?.(); } catch { /* ignore audio playback errors */ }
        showThresholdAlert(a);
      }
    });

    if (newAlerts.length > 0) setActiveAlerts(prev => [...prev, ...newAlerts].slice(-20));
    setAlertedCalls(newAlertedCalls);
  }, [activeCalls, alertsEnabled, alertThreshold, alertedCalls, showThresholdAlert, sendBrowserNotification]);

  const playHoldReminder = useCallback(() => {
    if (!isEnabled) return;
    initAudio();
    const callsOnHold = activeCalls.filter(c => c.isOnHold);
    if (callsOnHold.length === 0) return;
    const now = Date.now();
    const newLRT = { ...lastReminderTime };
    let shouldNotify = false;
    callsOnHold.forEach(c => { if (now - (lastReminderTime[c.id] || 0) >= intervalMs) { shouldNotify = true; newLRT[c.id] = now; } });
    if (shouldNotify) { try { playSoundRef.current?.(); } catch { /* ignore audio playback errors */ } showVisualNotification(callsOnHold); }
    setLastReminderTime(newLRT);
  }, [activeCalls, isEnabled, lastReminderTime, initAudio, intervalMs, showVisualNotification]);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => { playHoldReminder(); checkHoldAlerts(); }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playHoldReminder, checkHoldAlerts]);

  useEffect(() => {
    const ids = new Set(activeCalls.map(c => c.id));
    setLastReminderTime(prev => { const c: Record<string, number> = {}; Object.entries(prev).forEach(([k, v]) => { if (ids.has(k)) c[k] = v; }); return c; });
    setAlertedCalls(prev => { const c: Record<string, { warning: boolean; critical: boolean }> = {}; Object.entries(prev).forEach(([k, v]) => { if (ids.has(k)) c[k] = v; }); return c; });
    setActiveAlerts(prev => prev.filter(a => { const c = activeCalls.find(x => x.id === a.callId); return c && c.isOnHold; }));
  }, [activeCalls]);

  const toggleReminder = useCallback(() => { setIsEnabled(prev => { const v = !prev; saveToStorage(STORAGE_KEY_ENABLED, String(v)); return v; }); }, []);
  const toggleAlerts = useCallback(() => { setAlertsEnabled(prev => { const v = !prev; saveToStorage(STORAGE_KEY_ALERTS_ENABLED, String(v)); return v; }); }, []);
  const changeInterval = useCallback((ni: ReminderInterval) => { setInterval(ni); saveToStorage(STORAGE_KEY_INTERVAL, String(ni)); setLastReminderTime({}); }, []);
  const changeAlertThreshold = useCallback((nt: HoldAlertThreshold) => { setAlertThreshold(nt); saveToStorage(STORAGE_KEY_ALERT_THRESHOLD, String(nt)); setAlertedCalls({}); }, []);
  const clearAlerts = useCallback(() => setActiveAlerts([]), []);
  const getCallsOnHold = useCallback(() => activeCalls.filter(c => c.isOnHold), [activeCalls]);

  return {
    isEnabled, interval, alertThreshold, alertsEnabled, activeAlerts, browserNotificationsEnabled,
    toggleReminder, toggleAlerts, changeInterval, changeAlertThreshold, clearAlerts,
    requestBrowserNotifications, callsOnHold: getCallsOnHold(), initAudio,
  };
}
