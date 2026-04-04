/**
 * Centralized structured logger.
 * - In development: logs to console with structured prefix.
 * - In production: suppresses debug/info, only logs warn/error.
 * - Masks PII and sensitive data automatically.
 * - Provides consistent log format across the entire codebase.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|session|key|credential/i;

function maskSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[deep object]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitive(item, depth + 1));
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.test(key)) {
      masked[key] = '[REDACTED]';
    } else {
      masked[key] = maskSensitive(value, depth + 1);
    }
  }
  return masked;
}

const isDev = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  : false;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = isDev ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  const ctx = entry.context ? `[${entry.context}]` : '';
  return `${entry.timestamp} [${entry.level.toUpperCase()}]${ctx} ${entry.message}`;
}

function log(level: LogLevel, message: string, context?: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data: data !== undefined ? maskSensitive(data) : undefined,
  };

  const formatted = formatEntry(entry);

  const args: unknown[] = [formatted];
  if (entry.data !== undefined) args.push(entry.data);

  switch (level) {
    case 'debug':
      console.debug(...args);
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

/** Create a scoped logger for a specific module/component */
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
