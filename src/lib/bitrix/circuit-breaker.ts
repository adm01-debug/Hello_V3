/**
 * Circuit Breaker client-side para chamadas ao Bitrix24 (via edge `bitrix-api`).
 *
 * Espelha o padrão de `resilientFetch` usado no servidor. Estados:
 *   - closed:    chamadas passam normalmente. Falhas consecutivas incrementam contador.
 *   - open:      curto-circuita imediatamente. Após `cooldownMs`, passa para half-open.
 *   - half-open: permite UMA chamada de teste. Sucesso → closed. Falha → open novamente.
 *
 * Também respeita sinalização explícita do servidor via payload `{ circuit_open: true }`.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

interface BreakerConfig {
  failureThreshold: number;
  cooldownMs: number;
}

const DEFAULT_CONFIG: BreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 30_000,
};

interface BreakerInternal {
  state: CircuitState;
  failures: number;
  openedAt: number | null;
}

const breaker: BreakerInternal = {
  state: 'closed',
  failures: 0,
  openedAt: null,
};

const config: BreakerConfig = { ...DEFAULT_CONFIG };

/** Configura os thresholds (opcional). Útil em testes. */
export function configureBreaker(partial: Partial<BreakerConfig>): void {
  Object.assign(config, partial);
}

/** Estado atual (leitura). */
export function getBreakerState(): CircuitState {
  maybeHalfOpen();
  return breaker.state;
}

/** Retorna true se a chamada deve ser bloqueada (circuito aberto). */
export function shouldShortCircuit(): boolean {
  maybeHalfOpen();
  return breaker.state === 'open';
}

/** Sinaliza sucesso — reseta contador. */
export function recordSuccess(): void {
  breaker.failures = 0;
  breaker.state = 'closed';
  breaker.openedAt = null;
}

/** Sinaliza falha — abre o circuito se atingir threshold. */
export function recordFailure(): void {
  breaker.failures += 1;
  if (breaker.failures >= config.failureThreshold) {
    breaker.state = 'open';
    breaker.openedAt = Date.now();
  }
}

/** Abre o circuito imediatamente (ex.: servidor retornou `circuit_open`). */
export function tripOpen(): void {
  breaker.state = 'open';
  breaker.openedAt = Date.now();
  breaker.failures = config.failureThreshold;
}

/** Força reset (útil em testes / logout). */
export function resetBreaker(): void {
  breaker.state = 'closed';
  breaker.failures = 0;
  breaker.openedAt = null;
}

/** Se passou o cooldown, muda para half-open. */
function maybeHalfOpen(): void {
  if (breaker.state === 'open' && breaker.openedAt !== null) {
    if (Date.now() - breaker.openedAt >= config.cooldownMs) {
      breaker.state = 'half-open';
    }
  }
}

/** Tempo restante (ms) até o próximo teste half-open. 0 se já disponível. */
export function cooldownRemainingMs(): number {
  if (breaker.state !== 'open' || breaker.openedAt === null) return 0;
  const remaining = config.cooldownMs - (Date.now() - breaker.openedAt);
  return Math.max(0, remaining);
}
