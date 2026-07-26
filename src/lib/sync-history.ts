/**
 * Histórico curto das últimas sincronizações de preferências.
 *
 * Puramente cosmético e local (localStorage), escopado por usuário para não
 * vazar entre agentes que compartilham a mesma estação (hot desking).
 * Nunca participa de autorização e nunca lança: storage hostil (modo privado,
 * quota estourada) degrada silenciosamente para "sem histórico".
 */

import { sanitizeDeviceLabel, MAX_DEVICE_LABEL_LENGTH } from '@/lib/device-identity';

export const MAX_SYNC_HISTORY_ENTRIES = 12;
const STORAGE_PREFIX = 'lovable.sync-history';

export interface SyncHistoryEntry {
  /** O que mudou, ex.: "Toque", "Filtro". */
  subject: string;
  /** Descrição curta do novo valor, ex.: "Clássico" ou "VIP". */
  detail: string;
  /** Rótulo do dispositivo de origem (null = desconhecido/local). */
  device: string | null;
  /** Epoch em milissegundos. */
  at: number;
}

export interface SyncHistoryStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): SyncHistoryStorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Chave isolada por usuário; usuários anônimos usam o escopo "anon". */
export function buildSyncHistoryKey(userId: string | null | undefined): string {
  const scope = typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : 'anon';
  return `${STORAGE_PREFIX}:${scope}`;
}

function sanitizeText(value: unknown, fallback: string): string {
  const cleaned = sanitizeDeviceLabel(value);
  return cleaned ?? fallback;
}

/** Normaliza uma entrada arbitrária; devolve null quando irrecuperável. */
export function sanitizeEntry(raw: unknown): SyncHistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as Record<string, unknown>;
  const at = Number(candidate.at);
  if (!Number.isFinite(at) || at <= 0) return null;
  return {
    subject: sanitizeText(candidate.subject, 'Preferência'),
    detail: sanitizeText(candidate.detail, '—').slice(0, MAX_DEVICE_LABEL_LENGTH),
    device: sanitizeDeviceLabel(candidate.device),
    at: Math.floor(at),
  };
}

/** Insere no topo e mantém no máximo `MAX_SYNC_HISTORY_ENTRIES` itens. */
export function appendEntry(
  history: readonly SyncHistoryEntry[],
  entry: SyncHistoryEntry,
): SyncHistoryEntry[] {
  return [entry, ...history].slice(0, MAX_SYNC_HISTORY_ENTRIES);
}

export function loadSyncHistory(
  userId: string | null | undefined,
  storage: SyncHistoryStorageLike | null = defaultStorage(),
): SyncHistoryEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(buildSyncHistoryKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeEntry)
      .filter((item): item is SyncHistoryEntry => item !== null)
      .slice(0, MAX_SYNC_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

/** Grava a entrada e devolve o histórico resultante (já truncado e saneado). */
export function recordSyncEvent(
  userId: string | null | undefined,
  entry: { subject: unknown; detail: unknown; device?: unknown; at?: unknown },
  storage: SyncHistoryStorageLike | null = defaultStorage(),
): SyncHistoryEntry[] {
  const normalized = sanitizeEntry({
    ...entry,
    at: Number.isFinite(Number(entry.at)) && Number(entry.at) > 0 ? Number(entry.at) : Date.now(),
  });
  if (!normalized) return loadSyncHistory(userId, storage);

  const next = appendEntry(loadSyncHistory(userId, storage), normalized);
  if (storage) {
    try {
      storage.setItem(buildSyncHistoryKey(userId), JSON.stringify(next));
    } catch {
      // Sem persistência: o valor em memória ainda é útil nesta sessão.
    }
  }
  return next;
}

export function clearSyncHistory(
  userId: string | null | undefined,
  storage: SyncHistoryStorageLike | null = defaultStorage(),
): SyncHistoryEntry[] {
  if (storage) {
    try {
      storage.removeItem(buildSyncHistoryKey(userId));
    } catch {
      // Ignorado por design.
    }
  }
  return [];
}

/** Texto de exibição de uma entrada: "Toque → Clássico · Chrome em Windows às 14:32". */
export function formatSyncEntry(entry: SyncHistoryEntry): string {
  const origin = entry.device ?? 'este dispositivo';
  const time = new Date(entry.at);
  const clock = Number.isNaN(time.getTime())
    ? ''
    : ` às ${time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return `${entry.subject} → ${entry.detail} · ${origin}${clock}`;
}

/** Assuntos distintos presentes no histórico, em ordem alfabética (pt-BR). */
export function listSyncSubjects(entries: readonly SyncHistoryEntry[]): string[] {
  const unique = new Set<string>();
  for (const entry of entries) {
    const subject = typeof entry?.subject === 'string' ? entry.subject.trim() : '';
    if (subject.length > 0) unique.add(subject);
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Filtra por assunto; `null`/vazio devolve tudo (nunca lança). */
export function filterSyncEntries(
  entries: readonly SyncHistoryEntry[],
  subject: string | null | undefined,
): SyncHistoryEntry[] {
  const target = typeof subject === 'string' ? subject.trim() : '';
  if (target.length === 0) return [...entries];
  return entries.filter((entry) => entry?.subject?.trim() === target);
}
