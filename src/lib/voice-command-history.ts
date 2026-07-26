/**
 * Histórico curto de comandos de voz recentes.
 *
 * Armazenado localmente (por estação), com sanitização agressiva e
 * degradação segura quando o `localStorage` está indisponível (modo
 * privado, quota estourada, storage hostil que lança em qualquer acesso).
 */

const STORAGE_PREFIX = 'voice:command-history:v1';
export const MAX_HISTORY_ENTRIES = 6;
export const MAX_COMMAND_LENGTH = 120;

export interface VoiceCommandEntry {
  /** Texto do comando já sanitizado. */
  command: string;
  /** Epoch em milissegundos da última execução. */
  at: number;
}

function storageKey(userId: string | null | undefined): string {
  const scope = typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : 'anon';
  return `${STORAGE_PREFIX}:${scope}`;
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Normaliza um comando: remove controles, colapsa espaços e limita tamanho. */
export function sanitizeCommand(value: unknown): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const withoutControls = value.replace(/[\u0000-\u001f\u007f]/g, ' ');
  const collapsed = withoutControls.replace(/\s+/g, ' ').trim();
  return collapsed.slice(0, MAX_COMMAND_LENGTH);
}

function sanitizeEntry(raw: unknown): VoiceCommandEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as { command?: unknown; at?: unknown };
  const command = sanitizeCommand(candidate.command);
  if (!command) return null;
  const at = typeof candidate.at === 'number' && Number.isFinite(candidate.at) && candidate.at > 0
    ? Math.floor(candidate.at)
    : Date.now();
  return { command, at };
}

/** Lê o histórico do usuário; nunca lança. */
export function loadCommandHistory(userId: string | null | undefined): VoiceCommandEntry[] {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries: VoiceCommandEntry[] = [];
    for (const item of parsed) {
      const entry = sanitizeEntry(item);
      if (entry) entries.push(entry);
      if (entries.length >= MAX_HISTORY_ENTRIES) break;
    }
    return entries;
  } catch {
    return [];
  }
}

function persist(userId: string | null | undefined, entries: VoiceCommandEntry[]): VoiceCommandEntry[] {
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(storageKey(userId), JSON.stringify(entries));
    } catch {
      // Preferência acessória: silencioso por design.
    }
  }
  return entries;
}

/**
 * Insere um comando no topo do histórico (dedupe case-insensitive) e devolve
 * a nova lista já truncada. Comandos vazios não alteram o histórico.
 */
export function pushCommandHistory(
  userId: string | null | undefined,
  command: unknown,
  now: number = Date.now(),
): VoiceCommandEntry[] {
  const sanitized = sanitizeCommand(command);
  const current = loadCommandHistory(userId);
  if (!sanitized) return current;

  const at = Number.isFinite(now) && now > 0 ? Math.floor(now) : Date.now();
  const key = sanitized.toLowerCase();
  const deduped = current.filter((entry) => entry.command.toLowerCase() !== key);
  const next = [{ command: sanitized, at }, ...deduped].slice(0, MAX_HISTORY_ENTRIES);
  return persist(userId, next);
}

/** Limpa o histórico do escopo informado. */
export function clearCommandHistory(userId: string | null | undefined): VoiceCommandEntry[] {
  const storage = safeStorage();
  if (storage) {
    try {
      storage.removeItem(storageKey(userId));
    } catch {
      // silencioso
    }
  }
  return [];
}
