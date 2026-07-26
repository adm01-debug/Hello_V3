import { useCallback, useEffect, useState } from 'react';
import {
  clearSyncHistory,
  loadSyncHistory,
  recordSyncEvent,
  type SyncHistoryEntry,
} from '@/lib/sync-history';

/**
 * Assinantes do histórico local. Um emissor em memória mantém todas as
 * instâncias do painel coerentes sem depender de eventos de storage
 * (que não disparam na própria aba).
 */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** Registra um evento de sincronização e avisa os painéis abertos. */
export function pushSyncEvent(
  userId: string | null | undefined,
  entry: { subject: string; detail: string; device?: string | null },
): void {
  recordSyncEvent(userId, entry);
  notify();
}

/** Histórico curto (últimas 5) das mudanças de preferências deste usuário. */
export function useSyncHistory(userId: string | null) {
  const [entries, setEntries] = useState<SyncHistoryEntry[]>([]);

  const refresh = useCallback(() => {
    setEntries(loadSyncHistory(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  const clear = useCallback(() => {
    setEntries(clearSyncHistory(userId));
    notify();
  }, [userId]);

  return { entries, clear };
}
