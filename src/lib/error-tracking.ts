/**
 * Global error tracking — captures unhandled errors and promise rejections.
 * Sends to console in dev, can be extended to send to a logging endpoint.
 */

interface ErrorReport {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
  url: string;
  userAgent: string;
  type: 'error' | 'unhandled-rejection';
}

const ERROR_BUFFER: ErrorReport[] = [];
const MAX_BUFFER = 20;

function addReport(report: ErrorReport): void {
  if (ERROR_BUFFER.length >= MAX_BUFFER) ERROR_BUFFER.shift();
  ERROR_BUFFER.push(report);
  console.error(`[ErrorTracker] ${report.type}:`, report.message);
}

export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    addReport({
      message: event.message || 'Unknown error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      type: 'error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    addReport({
      message: reason?.message || String(reason) || 'Unhandled rejection',
      stack: reason?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      type: 'unhandled-rejection',
    });
  });
}

export function getErrorReports(): ReadonlyArray<ErrorReport> {
  return [...ERROR_BUFFER];
}
