/**
 * Centralized structured logger.
 * - Dev: console com prefixo estruturado. Prod: apenas warn/error.
 * - Mascara PII automaticamente. Suporta correlação por requestId.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  data?: unknown;
}

const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|session|key|credential/i;

function maskSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[deep object]';
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => maskSensitive(item, depth + 1));
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    masked[key] = SENSITIVE_KEYS.test(key) ? '[REDACTED]' : maskSensitive(value, depth + 1);
  }
  return masked;
}

const isDev = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  : false;

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = isDev ? 'debug' : 'warn';
const shouldLog = (level: LogLevel): boolean => LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];

// ─── Request ID Correlation ────────────────────────────────────────────────
let _currentRequestId: string | undefined;

export function generateRequestId(): string {
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const setRequestId = (id: string): void => { _currentRequestId = id; };
export const getRequestId = (): string | undefined => _currentRequestId;
export const clearRequestId = (): void => { _currentRequestId = undefined; };

export function withRequestId<T>(fn: () => T, id?: string): T {
  setRequestId(id ?? generateRequestId());
  try { return fn(); } finally { clearRequestId(); }
}

// ─── Core Logging ──────────────────────────────────────────────────────────
function log(level: LogLevel, message: string, context?: string, data?: unknown): void {
  if (!shouldLog(level)) return;
  const entry: LogEntry = {
    level, message, context,
    timestamp: new Date().toISOString(),
    requestId: _currentRequestId,
    data: data !== undefined ? maskSensitive(data) : undefined,
  };
  const ctx = entry.context ? `[${entry.context}]` : '';
  const rid = entry.requestId ? `[rid:${entry.requestId}]` : '';
  const formatted = `${entry.timestamp} [${entry.level.toUpperCase()}]${ctx}${rid} ${entry.message}`;
  const args: unknown[] = entry.data !== undefined ? [formatted, entry.data] : [formatted];
  console[level](...args);
}

function createLogger(context: string) {
  return {
    debug: (msg: string, data?: unknown) => log('debug', msg, context, data),
    info: (msg: string, data?: unknown) => log('info', msg, context, data),
    warn: (msg: string, data?: unknown) => log('warn', msg, context, data),
    error: (msg: string, data?: unknown) => log('error', msg, context, data),
  };
}

export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, undefined, data),
  info: (msg: string, data?: unknown) => log('info', msg, undefined, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, undefined, data),
  error: (msg: string, data?: unknown) => log('error', msg, undefined, data),
  create: createLogger,
};

export type Logger = ReturnType<typeof createLogger>;
