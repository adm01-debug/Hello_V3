/**
 * Mock observability system (Sentry/Prometheus)
 */
export async function trackMetric(name: string, value: number, tags: Record<string, string> = {}) {
  // In a real production app, this would call Sentry.captureMessage or a Prometheus pushgateway
  console.log(`[Metric] ${name}: ${value}`, tags);
  
  if (name === 'rate_limit_exceeded' || name === 'validation_error_422') {
    // If it's a critical spike, we could trigger an alert
    if (value > 10) {
      console.warn(`[ALERT] Spike detected in ${name}! Current value: ${value}`);
    }
  }
}

/**
 * Log structured error for observability
 */
export function logStructuredError(error: unknown, context: Record<string, unknown> = {}) {
  console.error('[Structured Error]', {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    ...context
  });
}
