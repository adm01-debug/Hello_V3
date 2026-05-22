/**
 * Global error tracking — captures unhandled errors and promise rejections.
 * Sends to console in dev, can be extended to send to a logging endpoint.
 */

import { supabase } from "@/integrations/supabase/client";

interface ErrorReport {
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
  metadata?: Record<string, any>;
}

const ERROR_BUFFER: ErrorReport[] = [];
const MAX_BUFFER = 50;

async function sendToLog(report: ErrorReport) {
  try {
    // In production, we would send this to an Edge Function or Sentry-like service
    // For now, we persist in local buffer and log to console
    console.error(`[ErrorTracker] [${report.type.toUpperCase()}] at ${report.url}:`, {
      message: report.message,
      stack: report.stack,
      metadata: report.metadata,
    });

    // Example of optional persistent logging (commented out to avoid side-effects during dev unless needed)
    /*
    await supabase.from('client_error_logs').insert([{
      message: report.message,
      stack_trace: report.stack,
      url: report.url,
      type: report.type,
      metadata: report.metadata,
      user_agent: report.userAgent
    }]);
    */
  } catch (e) {
    console.warn('[ErrorTracker] Failed to send log:', e);
  }
}

function addReport(report: ErrorReport): void {
  if (ERROR_BUFFER.length >= MAX_BUFFER) ERROR_BUFFER.shift();
  ERROR_BUFFER.push(report);
  sendToLog(report);
}

export function reportError(params: {
  message: string;
  type?: ErrorReport['type'];
  error?: Error;
  metadata?: Record<string, any>;
}) {
  const { message, type = 'error', error, metadata } = params;
  
  addReport({
    message,
    stack: error?.stack,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    type,
    metadata
  });
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

