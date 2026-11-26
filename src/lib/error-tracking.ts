/**
 * Global error tracking — captures unhandled errors and promise rejections.
 * Logs to console in dev; can be extended to forward to a logging endpoint.
 */

export interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  url: string;
  userAgent: string;
  type: 'error' | 'unhandled-rejection' | 'react-component' | 'network-error';
  userId?: string;
  metadata?: Record<string, unknown>;
}

const ERROR_BUFFER: ErrorReport[] = [];
const MAX_BUFFER = 20;

/**
 * Sink opcional para persistir os relatos (etapa 230). `error-tracking` segue
 * sem dependencia de Supabase; `src/lib/errorReporter.ts` registra o sink.
 */
let errorSink: ((report: ErrorReport) => void) | null = null;

export function setErrorSink(sink: ((report: ErrorReport) => void) | null): void {
  errorSink = sink;
}

/** Shared environment fields attached to every report. */
function context() {
  return { timestamp: Date.now(), url: window.location.href, userAgent: navigator.userAgent };
}

function sendToLog(r: ErrorReport) {
  try {
    console.error(`[ErrorTracker] [${r.type.toUpperCase()}] at ${r.url}:`, {
      message: r.message, stack: r.stack, metadata: r.metadata,
    });
  } catch (e) {
    console.warn('[ErrorTracker] Failed to send log:', e);
  }
}

function addReport(report: ErrorReport): void {
  if (ERROR_BUFFER.length >= MAX_BUFFER) ERROR_BUFFER.shift();
  ERROR_BUFFER.push(report);
  sendToLog(report);
  if (errorSink) {
    try {
      errorSink(report);
    } catch (e) {
      // Persistir nunca pode derrubar o handler de erro.
      console.warn('[ErrorTracker] Failed to persist report:', e);
    }
  }
}

export function reportError(params: {
  message: string;
  type?: ErrorReport['type'];
  error?: Error;
  metadata?: Record<string, unknown>;
}) {
  const { message, type = 'error', error, metadata } = params;
  addReport({ message, stack: error?.stack, type, metadata, ...context() });
}

export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    addReport({
      message: event.message || 'Unknown error',
      filename: event.filename, lineno: event.lineno, colno: event.colno,
      type: 'error', ...context(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    addReport({
      message: reason?.message || String(reason) || 'Unhandled rejection',
      stack: reason?.stack, type: 'unhandled-rejection', ...context(),
    });
  });
}

export function getErrorReports(): ReadonlyArray<ErrorReport> {
  return [...ERROR_BUFFER];
}
