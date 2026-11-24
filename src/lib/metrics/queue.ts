/**
 * Metricas de fila — fonte unica das formulas de nivel de servico, abandono e
 * espera media.
 *
 * ATENCAO: este modulo existe em dois lugares por necessidade de runtime —
 * aqui (front, bundler) e em `supabase/functions/_shared/queue-metrics.ts`
 * (edges Deno, que nao importam de `src/`). As duas copias tem os mesmos testes
 * e precisam mudar juntas; divergencia entre elas e bug.
 *
 * Todas as funcoes sao puras e devolvem `null` quando nao existe amostra — a
 * mesma licao das etapas 092-095: `0` e uma medida, `null` e ausencia de
 * medida, e exibir `0%` quando nao houve chamada e falso.
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
 * Denominador: chamadas com espera mensuravel, **incluindo abandonadas**. O
 * calculo antigo dividia so pelas atendidas, o que fazia o abandono nunca
 * penalizar o indicador. Quem adotar esta funcao precisa saber que o numero
 * muda em relacao ao calculo legado.
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

/**
 * Percentual (0-100) de abandonos sobre o total de chamadas que entraram na
 * fila e tiveram desfecho — atendidas ou abandonadas. `missed` (nao atendida
 * pelo agente e nao abandonada pelo cliente) fica fora dos dois lados.
 */
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
