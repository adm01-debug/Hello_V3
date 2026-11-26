/** Captura erros não tratados e rejeições; um sink opcional os persiste (etapa 230). */

export interface ErrorReport {
  message: string;
  type: 'error' | 'unhandled-rejection' | 'react-component' | 'network-error';
  timestamp: number;
  url: string;
  userAgent: string;
  stack?: string;
  componentStack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

type ErrorSink = (report: ErrorReport) => void;

const ERROR_BUFFER: ErrorReport[] = [];
const MAX_BUFFER = 20;
let errorSink: ErrorSink | null = null;

/** `errorReporter.ts` se registra aqui; este módulo segue sem Supabase. */
export function setErrorSink(sink: ErrorSink | null): void {
  errorSink = sink;
}

/** Shared environment fields attached to every report. */
function context() {
  return { timestamp: Date.now(), url: window.location.href, userAgent: navigator.userAgent };
}

function addReport(report: ErrorReport): void {
  if (ERROR_BUFFER.length >= MAX_BUFFER) ERROR_BUFFER.shift();
  ERROR_BUFFER.push(report);
  // Instrumentação nunca pode derrubar o handler de erro.
  try {
    console.error(`[ErrorTracker] [${report.type.toUpperCase()}] at ${report.url}:`, {
      message: report.message, stack: report.stack, metadata: report.metadata,
    });
    errorSink?.(report);
  } catch (e) {
    console.warn('[ErrorTracker] failed to log/persist:', e);
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