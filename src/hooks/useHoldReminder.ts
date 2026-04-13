import { logger } from '@/lib/logger';
const log = logger.create('HoldReminder');
import { useEffect, useRef, useCallback, useState } from 'react';
import { CallSession } from './useMultiChannelCall';
import { toast } from 'sonner';
import {
  createNotificationSound, createUrgentSound, formatHoldTime,
  loadSavedInterval, loadSavedEnabled, loadSavedAlertThreshold, loadSavedAlertsEnabled, saveToStorage,
} from './useHoldReminderAudio';

export type ReminderInterval = 15 | 30 | 60;
export type HoldAlertThreshold = 30 | 60 | 120 | 180 | 300;

export const REMINDER_INTERVALS: { value: ReminderInterval; label: string }[] = [
  { value: 15, label: '15s' }, { value: 30, label: '30s' }, { value: 60, label: '60s' },
];

export const ALERT_THRESHOLDS: { value: HoldAlertThreshold; label: string }[] = [
  { value: 30, label: '30s' }, { value: 60, label: '1min' }, { value: 120, label: '2min' }, { value: 180, label: '3min' }, { value: 300, label: '5min' },
];

export interface HoldAlert {
  callId: string; callName: string; holdTime: number; threshold: number; triggeredAt: Date; severity: 'warning' | 'critical';
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
        { body: `${alert.callName} em espera há ${formatHoldTime(alert.holdTime)}`, icon: '/favicon.ico', tag: `hold-alert-${alert.callId}`, requireInteraction: alert.severity === 'critical' }
      );
      n.onclick = () => { window.focus(); n.close(); };
      if (alert.severity !== 'critical') setTimeout(() => n.close(), 10000);
    } catch { log.warn('Failed to send browser notification'); }
  }, [browserNotificationsEnabled]);

  const initAudio = useCallback(() => {
    if (!playSoundRef.current) playSoundRef.current = createNotificationSound();
    if (!playUrgentSoundRef.current) playUrgentSoundRef.current = createUrgentSound();
  }, []);

  const showVisualNotification = useCallback((callsOnHold: CallSession[]) => {
    const names = callsOnHold.map(c => c.contactName || c.phoneNumber || 'Chamada').join(', ');
    toast("📞 Chamada em espera", { description: callsOnHold.length === 1 ? `${names} aguardando atenção` : `${callsOnHold.length} chamadas aguardando: ${names}`, duration: 5000 });
  }, []);

  const showThresholdAlert = useCallback((alert: HoldAlert) => {
    if (alert.severity === 'critical') toast.error("🚨 Alerta Crítico", { description: `${alert.callName} em espera há ${formatHoldTime(alert.holdTime)}`, duration: 10000 });
    else toast.warning("⚠️ Alerta de Espera", { description: `${alert.callName} em espera há ${formatHoldTime(alert.holdTime)}`, duration: 7000 });
  }, []);

  const checkHoldAlerts = useCallback(() => {
    if (!alertsEnabled) return;
    const callsOnHold = activeCalls.filter(c => c.isOnHold);
    const newAlerts: HoldAlert[] = [];
    const newAlertedCalls = { ...alertedCalls };

    callsOnHold.forEach(call => {
      const holdTime = call.totalHoldTime;
      const callName = call.contactName || call.phoneNumber || 'Chamada';
      const ca = newAlertedCalls[call.id] || { warning: false, critical: false };
      const criticalThreshold = alertThreshold * 2;

      if (holdTime >= criticalThreshold && !ca.critical) {
        const a: HoldAlert = { callId: call.id, callName, holdTime, threshold: criticalThreshold, triggeredAt: new Date(), severity: 'critical' };
        newAlerts.push(a); newAlertedCalls[call.id] = { ...ca, critical: true };
        try { playUrgentSoundRef.current?.(); } catch { /* ignore */ }
        sendBrowserNotification(a); showThresholdAlert(a);
      } else if (holdTime >= alertThreshold && !ca.warning) {
        const a: HoldAlert = { callId: call.id, callName, holdTime, threshold: alertThreshold, triggeredAt: new Date(), severity: 'warning' };
        newAlerts.push(a); newAlertedCalls[call.id] = { ...ca, warning: true };
        try { playSoundRef.current?.(); } catch { /* ignore */ }
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
    const newTimes = { ...lastReminderTime };
    let shouldNotify = false;
    callsOnHold.forEach(c => { if (now - (lastReminderTime[c.id] || 0) >= intervalMs) { shouldNotify = true; newTimes[c.id] = now; } });
    if (shouldNotify) { try { playSoundRef.current?.(); } catch { /* ignore */ } showVisualNotification(callsOnHold); }
    setLastReminderTime(newTimes);
  }, [activeCalls, isEnabled, lastReminderTime, initAudio, intervalMs, showVisualNotification]);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => { playHoldReminder(); checkHoldAlerts(); }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playHoldReminder, checkHoldAlerts]);

  useEffect(() => {
    const ids = new Set(activeCalls.map(c => c.id));
    setLastReminderTime(prev => { const c: Record<string, number> = {}; Object.entries(prev).forEach(([id, t]) => { if (ids.has(id)) c[id] = t; }); return c; });
    setAlertedCalls(prev => { const c: Record<string, { warning: boolean; critical: boolean }> = {}; Object.entries(prev).forEach(([id, a]) => { if (ids.has(id)) c[id] = a; }); return c; });
    setActiveAlerts(prev => prev.filter(a => { const c = activeCalls.find(x => x.id === a.callId); return c && c.isOnHold; }));
  }, [activeCalls]);

  const toggleReminder = useCallback(() => { setIsEnabled(prev => { const v = !prev; saveToStorage('ENABLED', String(v)); return v; }); }, []);
  const toggleAlerts = useCallback(() => { setAlertsEnabled(prev => { const v = !prev; saveToStorage('ALERTS_ENABLED', String(v)); return v; }); }, []);
  const changeInterval = useCallback((n: ReminderInterval) => { setInterval(n); saveToStorage('INTERVAL', String(n)); setLastReminderTime({}); }, []);
  const changeAlertThreshold = useCallback((n: HoldAlertThreshold) => { setAlertThreshold(n); saveToStorage('ALERT_THRESHOLD', String(n)); setAlertedCalls({}); }, []);
  const clearAlerts = useCallback(() => { setActiveAlerts([]); }, []);
  const callsOnHold = activeCalls.filter(c => c.isOnHold);

  return {
    isEnabled, interval, alertThreshold, alertsEnabled, activeAlerts, browserNotificationsEnabled,
    toggleReminder, toggleAlerts, changeInterval, changeAlertThreshold, clearAlerts,
    requestBrowserNotifications, callsOnHold, initAudio,
  };
}
