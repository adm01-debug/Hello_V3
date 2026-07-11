/**
 * Resilience utilities for external API calls.
 * - Retry with exponential backoff + jitter
 * - Circuit breaker per key (CLOSED → OPEN → HALF_OPEN)
 *
 * Pure, deterministic (accepts injectable clock + rng for testing).
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;      // consecutive failures to open
  openDurationMs?: number;        // how long to stay OPEN before HALF_OPEN probe
  halfOpenMaxCalls?: number;      // trial calls allowed in HALF_OPEN
  now?: () => number;             // clock injection
}

interface CircuitStats {
  state: CircuitState;
  failures: number;
  openedAt: number;
  halfOpenInFlight: number;
}

const circuits = new Map<string, CircuitStats>();

const DEFAULTS: Required<Omit<CircuitBreakerOptions, "now">> = {
  failureThreshold: 5,
  openDurationMs: 30_000,
  halfOpenMaxCalls: 1,
};

export function getCircuitState(key: string): CircuitState {
  return circuits.get(key)?.state ?? "CLOSED";
}

export function resetCircuit(key: string): void {
  circuits.delete(key);
}

export function _resetAllCircuits(): void {
  circuits.clear();
}

function ensureStats(key: string): CircuitStats {
  let stats = circuits.get(key);
  if (!stats) {
    stats = { state: "CLOSED", failures: 0, openedAt: 0, halfOpenInFlight: 0 };
    circuits.set(key, stats);
  }
  return stats;
}

export class CircuitOpenError extends Error {
  constructor(key: string) {
    super(`Circuit breaker OPEN for "${key}"`);
    this.name = "CircuitOpenError";
  }
}

/**
 * Wrap a call with circuit-breaker semantics.
 * Throws CircuitOpenError immediately when circuit is OPEN and cooldown not elapsed.
 */
export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  opts: CircuitBreakerOptions = {},
): Promise<T> {
  const cfg = { ...DEFAULTS, ...opts };
  const now = opts.now ?? Date.now;
  const stats = ensureStats(key);

  // Transition OPEN -> HALF_OPEN if cooldown elapsed
  if (stats.state === "OPEN" && now() - stats.openedAt >= cfg.openDurationMs) {
    stats.state = "HALF_OPEN";
    stats.halfOpenInFlight = 0;
  }

  if (stats.state === "OPEN") {
    throw new CircuitOpenError(key);
  }

  if (stats.state === "HALF_OPEN" && stats.halfOpenInFlight >= cfg.halfOpenMaxCalls) {
    throw new CircuitOpenError(key);
  }

  if (stats.state === "HALF_OPEN") stats.halfOpenInFlight++;

  try {
    const result = await fn();
    // success → reset
    stats.state = "CLOSED";
    stats.failures = 0;
    stats.openedAt = 0;
    stats.halfOpenInFlight = 0;
    return result;
  } catch (err) {
    stats.failures++;
    if (stats.state === "HALF_OPEN" || stats.failures >= cfg.failureThreshold) {
      stats.state = "OPEN";
      stats.openedAt = now();
      stats.halfOpenInFlight = 0;
    }
    throw err;
  }
}

// ---------- Retry with exponential backoff + jitter ----------

export interface RetryOptions {
  retries?: number;               // max additional attempts
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  sleep?: (ms: number) => Promise<void>;
  rng?: () => number;             // for deterministic tests
}

const defaultSleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

export function computeBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: boolean,
  rng: () => number = Math.random,
): number {
  const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  if (!jitter) return exp;
  // Full jitter (AWS): random in [0, exp]
  return Math.floor(rng() * exp);
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 200,
    maxDelayMs = 5_000,
    jitter = true,
    shouldRetry = defaultShouldRetry,
    sleep = defaultSleep,
    rng = Math.random,
  } = opts;

  let attempt = 0;
  // total tries = retries + 1
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err, attempt)) throw err;
      const delay = computeBackoff(attempt, baseDelayMs, maxDelayMs, jitter, rng);
      await sleep(delay);
      attempt++;
    }
  }
}

function defaultShouldRetry(err: unknown): boolean {
  // Retry on network-ish errors and 5xx / 429; skip 4xx (except 429)
  const msg = String((err as Error)?.message ?? err ?? "").toLowerCase();
  if (err instanceof CircuitOpenError) return false;
  // Best-effort HTTP status extraction
  const status = (err as { status?: number })?.status;
  if (typeof status === "number") {
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
    if (status >= 400 && status < 500) return false;
}

/**
 * Convenience wrapper: fetch com retry + circuit breaker.
 * Trata 429/5xx como erro para reciclar via retry.
 */
export async function resilientFetch(
  key: string,
  input: string | URL | Request,
  init?: RequestInit,
  opts: { retry?: RetryOptions; breaker?: CircuitBreakerOptions } = {},
): Promise<Response> {
  return resilientCall(key, async () => {
    const res = await fetch(input, init);
    if (res.status === 429 || res.status >= 500) {
      // Consumir corpo para evitar leak em Deno.
      try { await res.clone().text(); } catch { /* ignore */ }
      const err = new Error(`HTTP ${res.status}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    return res;
  }, opts);
}

  return /timeout|network|fetch|econn|socket|aborted/.test(msg);
}

/** Convenience: retry + circuit breaker together. */
export async function resilientCall<T>(
  key: string,
  fn: () => Promise<T>,
  opts: { retry?: RetryOptions; breaker?: CircuitBreakerOptions } = {},
): Promise<T> {
  return retry(() => withCircuitBreaker(key, fn, opts.breaker), opts.retry);
}
