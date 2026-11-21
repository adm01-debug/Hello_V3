/**
 * Calculo de error budget a partir de um SLI de proporcao.
 *
 * Duas grandezas independentes:
 *  - remaining_pct: quanto da tolerancia de falha ainda resta na janela (100 = nada consumido).
 *  - burn_rate: velocidade de consumo da tolerancia. 1 = consumindo exatamente o previsto
 *    para a janela inteira; > 1 = vai estourar o SLO antes do fim da janela.
 *
 * O status usa burn_rate, nao o estado instantaneo, porque um pico curto nao e o mesmo
 * que uma tendencia: burn_rate de 1 e o alvo, nao o limite.
 */

export type BudgetStatus = 'healthy' | 'warning' | 'exhausted' | 'unknown';

export interface BudgetInput {
  /** Total de eventos observados na janela. */
  total: number;
  /** Eventos que violaram o SLI. */
  bad: number;
  /** Alvo do SLO em percentual (ex.: 99.9). */
  targetPct: number;
  /** Amostras minimas para o calculo ser considerado valido. */
  minSamples?: number;
}

export interface BudgetResult {
  status: BudgetStatus;
  /** Percentual da tolerancia de falha que permanece disponivel. */
  remaining_pct: number;
  /** Velocidade de consumo do budget (1 = no ritmo previsto). */
  burn_rate: number;
  /** Tolerancia de falha usada, em fracao (0.001 para alvo 99.9%). */
  tolerance_pct: number;
}

const DEFAULT_MIN_SAMPLES = 10;

export function budget({
  total,
  bad,
  targetPct,
  minSamples = DEFAULT_MIN_SAMPLES,
}: BudgetInput): BudgetResult {
  const tolerance = Math.max(0, (100 - targetPct) / 100);

  if (!Number.isFinite(total) || total < minSamples) {
    return {
      status: 'unknown',
      remaining_pct: 100,
      burn_rate: 0,
      tolerance_pct: round(tolerance * 100),
    };
  }

  const failures = Math.min(Math.max(0, bad), total);
  const failureRate = failures / total;

  if (tolerance === 0) {
    // Alvo de 100%: qualquer falha esgota o budget.
    return {
      status: failures === 0 ? 'healthy' : 'exhausted',
      remaining_pct: failures === 0 ? 100 : 0,
      burn_rate: failures === 0 ? 0 : 1,
      tolerance_pct: 0,
    };
  }

  const consumed = failureRate / tolerance;
  const remaining = Math.max(0, 1 - consumed);

  const status: BudgetStatus = consumed >= 1 ? 'exhausted' : consumed >= 0.5 ? 'warning' : 'healthy';

  return {
    status,
    remaining_pct: round(remaining * 100),
    burn_rate: round(consumed),
    tolerance_pct: round(tolerance * 100),
  };
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}