/**
 * Distributed tracing — propaga correlation ID (trace ID) entre UI e edge functions.
 * Integra com o logger central (src/lib/logger.ts) para correlação cross-service.
 *
 * Uso:
 *   import { withTrace, getTraceId, traceHeaders } from '@/lib/tracing';
 *
 *   await withTrace('checkout', async () => {
 *     await supabase.functions.invoke('charge', { headers: traceHeaders() });
 *   });
 */

import { generateRequestId, setRequestId, clearRequestId, getRequestId, logger } from './logger';

const TRACE_HEADER = 'x-request-id';
const TRACE_OP_HEADER = 'x-trace-operation';

let _currentOperation: string | undefined;

/** Retorna o trace ID atual (ou undefined se nenhum escopo ativo) */
export function getTraceId(): string | undefined {
  return getRequestId();
}

/** Retorna o nome da operação corrente */
export function getTraceOperation(): string | undefined {
  return _currentOperation;
}

/**
 * Headers para propagar tracing em chamadas para edge functions.
 * Use spread em options.headers de fetch / supabase.functions.invoke.
 */
export function traceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const id = getRequestId();
  if (id) headers[TRACE_HEADER] = id;
  if (_currentOperation) headers[TRACE_OP_HEADER] = _currentOperation;
  return headers;
}

/**
 * Executa uma operação dentro de um escopo de tracing.
 * Gera trace ID automaticamente, loga início/fim/erro e limpa ao final.
 */
export async function withTrace<T>(
  operation: string,
  fn: () => Promise<T> | T,
  parentTraceId?: string,
): Promise<T> {
  const traceId = parentTraceId ?? generateRequestId();
  const previousOperation = _currentOperation;
  setRequestId(traceId);
  _currentOperation = operation;

  const start = performance.now();
  const log = logger.create('Trace');
  log.debug(`▶ ${operation}`);

  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    log.debug(`✓ ${operation} (${duration}ms)`);
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    log.error(`✗ ${operation} (${duration}ms)`, error);
    throw error;
  } finally {
    _currentOperation = previousOperation;
    if (!parentTraceId) clearRequestId();
  }
}

/**
 * Inicia um trace manual (sem escopo automático). Útil para fluxos longos
 * que cruzam vários hooks. Retorne o trace ID para passar adiante e use
 * `endTrace()` ao final.
 */
export function startTrace(operation: string): string {
  const id = generateRequestId();
  setRequestId(id);
  _currentOperation = operation;
  logger.create('Trace').debug(`▶ ${operation} [manual]`);
  return id;
}

export function endTrace(): void {
  if (_currentOperation) {
    logger.create('Trace').debug(`✓ ${_currentOperation} [manual]`);
  }
  _currentOperation = undefined;
  clearRequestId();
}

/** Extrai trace ID de headers de request (uso em edge functions) */
export function extractTraceIdFromHeaders(headers: Headers | Record<string, string>): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(TRACE_HEADER) ?? undefined;
  }
  return headers[TRACE_HEADER] ?? headers[TRACE_HEADER.toUpperCase()];
}

export const TRACE_HEADER_NAME = TRACE_HEADER;
export const TRACE_OPERATION_HEADER_NAME = TRACE_OP_HEADER;
