/**
 * Observabilidade estruturada para edge functions (JSON em 1 linha).
 * Logs parseáveis por ferramentas de observabilidade (Supabase Logs, Logflare).
 */

function jsonLine(level: string, event: string, data: Record<string, unknown> = {}) {
  return JSON.stringify({ level, event, ts: new Date().toISOString(), ...data });
}

export function logInfo(event: string, data: Record<string, unknown> = {}) {
  console.log(jsonLine('info', event, data));
}

export function logError(event: string, error: unknown, data: Record<string, unknown> = {}) {
  console.error(jsonLine('error', event, {
    error: error instanceof Error ? error.message : String(error),
    ...data,
  }));
}

export function logRequest(req: Request, status: number, durationMs: number, userId = 'anon') {
  const url = new URL(req.url);
  logInfo('request', {
    method: req.method,
    path: url.pathname + url.search,
    status,
    duration_ms: Math.round(durationMs * 10) / 10,
    user: userId,
  });
}

export function withRequestLog(
  fn: string,
  handler: (req: Request) => Promise<Response> | Response,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const started = performance.now();
    try {
      const res = await handler(req);
      logRequest(req, res.status, performance.now() - started);
      return res;
    } catch (err) {
      logError('unhandled_exception', err, { fn });
      throw err;
    }
  };
}

/**
 * Mock observability system (Sentry/Prometheus)
 */
export async function trackMetric(name: string, value: number, tags: Record<string, string> = {}) {
  console.log(jsonLine('metric', name, { value, ...tags }));

  if (name === 'rate_limit_exceeded' || name === 'validation_error_422') {
    if (value > 10) {
      console.warn(jsonLine('alert', 'spike_' + name, { value }));
    }
  }
}

/**
 * Log structured error for observability
 */
export function logStructuredError(error: unknown, context: Record<string, unknown> = {}) {
  logError('structured_error', error, context);
}