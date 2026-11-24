/**
 * E072 — Fila de retentativa para encerramento de chamadas que falharam.
 * Guarda só id e duração — sem conteúdo de transcrição (dado de cliente).
 * Limite de 20 itens; o mais antigo é descartado quando excede.
 */
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'pendingCallWrites_v1';
const MAX_ITEMS = 20;
const log = logger.create('PendingCallWrites');

export type EndedCallStatus = 'completed' | 'missed' | 'abandoned';

export interface PendingCallWrite {
  sessionId: string;
  durationSeconds: number;
  /** Desfecho da chamada; ausente em itens gravados antes da etapa 059. */
  status?: EndedCallStatus;
  enqueuedAt: string;
  summaryRef?: {
    overallSentiment: string;
    customerSatisfaction: number;
    agentPerformance: number;
  };
}

function load(): PendingCallWrite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingCallWrite[]) : [];
  } catch {
    return [];
  }
}

function save(items: PendingCallWrite[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    log.error('Nao foi possivel salvar fila pendente', e);
  }
}

export function enqueue(item: Omit<PendingCallWrite, 'enqueuedAt'>): void {
  const items = load();
  if (items.length >= MAX_ITEMS) {
    const dropped = items.shift();
    log.error('Fila pendente cheia — descartando mais antigo', { sessionId: dropped?.sessionId });
  }
  items.push({ ...item, enqueuedAt: new Date().toISOString() });
  save(items);
}

export function dequeue(): PendingCallWrite | null {
  const items = load();
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  save(rest);
  return first;
}

export function count(): number {
  return load().length;
}

export function clear(): void {
  localStorage.removeItem(STORAGE_KEY);
}