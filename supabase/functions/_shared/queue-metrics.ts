/**
 * Metricas de fila — copia consciente de `src/lib/metrics/queue.ts` para uso
 * nas Edge Functions (Deno nao importa de `src/`). As duas copias tem os
 * mesmos testes e precisam mudar juntas; divergencia entre elas e bug.
 *
 * Todas as funcoes sao puras e devolvem `null` quando nao existe amostra —
 * `0` e uma medida, `null` e ausencia de medida.
 */

export interface QueueCallSample {
  /** Espera ate o atendimento, em segundos. `null` = nao medido. */
  hold_time_seconds?: number | null;
  /** `completed` (atendida), `abandoned`, `missed`, etc. */
  status?: string | null;
}

const ATENDIDAS = new Set(['completed', 'answered']);
const ABANDONADAS = new Set(['abandoned']);

function espera(call: QueueCallSample): number | null {
  const valor = call.hold_time_seconds;
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) return null;
  return valor;
}

/**
 * Percentual (0-100) das chamadas atendidas dentro do limiar.
 *
 * Denominador: chamadas com espera mensuravel, incluindo abandonadas — o
 * calculo antigo dividia so pelas atendidas, o que fazia o abandono nunca
 * penalizar o indicador.
 */
export function serviceLevel(calls: QueueCallSample[], thresholdSeconds: number): number | null {
  if (!Number.isFinite(thresholdSeconds) || thresholdSeconds < 0) return null;
  const mensuraveis = calls.filter((call) => espera(call) !== null);
  if (mensuraveis.length === 0) return null;
  const dentroDoLimiar = mensuraveis.filter((call) => {
    const esperou = espera(call) as number;
    return ATENDIDAS.has(String(call.status)) && esperou <= thresholdSeconds;
  });
  return (dentroDoLimiar.length / mensuraveis.length) * 100;
}

/** Percentual (0-100) de abandonos sobre atendidas + abandonadas. */
export function abandonmentRate(calls: QueueCallSample[]): number | null {
  const atendidas = calls.filter((call) => ATENDIDAS.has(String(call.status))).length;
  const abandonadas = calls.filter((call) => ABANDONADAS.has(String(call.status))).length;
  const denominador = atendidas + abandonadas;
  if (denominador === 0) return null;
  return (abandonadas / denominador) * 100;
}

/** Espera media em segundos, apenas sobre chamadas com espera mensuravel. */
export function averageWaitTime(calls: QueueCallSample[]): number | null {
  const amostras = calls
    .map((call) => espera(call))
    .filter((valor): valor is number => valor !== null);
  if (amostras.length === 0) return null;
  const total = amostras.reduce((soma, valor) => soma + valor, 0);
  return total / amostras.length;
}
