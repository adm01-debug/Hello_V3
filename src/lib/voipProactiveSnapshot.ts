// Sistema de snapshot proativo de recomendações VoIP.
// Compara recomendações críticas atuais vs últimas vistas (24h+) e dispara
// toast urgente para qualquer crítica nova. Tudo client-side via localStorage.
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('voipProactiveSnapshot');
const SNAPSHOT_KEY = 'voip-rec-last-snapshot';
const PROACTIVE_PREF_KEY = 'voip-rec-proactive-enabled';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

interface Snapshot {
  ids: string[];
  takenAt: number;
}

interface CriticalRec {
  id: string;
  title: string;
  severity: string;
}

export function isProactiveEnabled(): boolean {
  try {
    return localStorage.getItem(PROACTIVE_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setProactiveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PROACTIVE_PREF_KEY, enabled ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function shouldRunProactiveCheck(): boolean {
  if (!isProactiveEnabled()) return false;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return true;
    const snap = JSON.parse(raw) as Snapshot;
    return Date.now() - snap.takenAt >= CHECK_INTERVAL_MS;
  } catch {
    return true;
  }
}

export function compareSnapshotAndNotify(currentCritical: CriticalRec[]): void {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    const previousIds = raw ? (JSON.parse(raw) as Snapshot).ids : [];
    const newCritical = currentCritical.filter(r => !previousIds.includes(r.id));

    if (newCritical.length > 0) {
      log.warn('Novas recomendações críticas detectadas', { count: newCritical.length });
      toast.warning(`${newCritical.length} nova(s) recomendação(ões) crítica(s) detectada(s)`, {
        description: newCritical.slice(0, 2).map(r => `• ${r.title}`).join('\n'),
        duration: 10000,
      });
    }

    const snapshot: Snapshot = {
      ids: currentCritical.map(r => r.id),
      takenAt: Date.now(),
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (err) {
    log.warn('Falha ao comparar snapshot proativo', err);
  }
}
