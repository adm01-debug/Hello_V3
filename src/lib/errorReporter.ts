/**
 * Reporter de erros do navegador (etapa 230 / achado A-097).
 *
 * `src/lib/error-tracking.ts` ja escutava `window.onerror` e
 * `unhandledrejection`, mas so escrevia no console e num buffer de 20 itens em
 * memoria — depois do proximo F5 nao sobrava nada. Este modulo registra um sink
 * nesse modulo e grava cada relato em `public.client_errors`, que a tela
 * `/admin/client-errors` lista.
 *
 * Regras de privacidade e custo:
 *  - so o `pathname` da rota vai para o banco (query string pode carregar token);
 *  - a mensagem e o stack sao truncados (limites iguais aos CHECK da tabela);
 *  - nunca lemos campo de formulario: o relato vem do erro, nao do DOM;
 *  - dedupe de 60s por tipo+mensagem e teto de 10 gravacoes por minuto, para um
 *    erro dentro de um loop nao inundar a tabela (nem gastar cota do Supabase);
 *  - sem sessao, nada e enviado (a policy de INSERT exige auth.uid() = user_id).
 */

import { supabase } from '@/integrations/supabase/client';
import { getTraceId } from './tracing';
import { setErrorSink, type ErrorReport } from './error-tracking';

export const CLIENT_ERROR_MESSAGE_MAX = 1000;
export const CLIENT_ERROR_STACK_MAX = 4000;
export const CLIENT_ERROR_ROUTE_MAX = 500;
export const CLIENT_ERROR_USER_AGENT_MAX = 500;
export const CLIENT_ERROR_CORRELATION_MAX = 100;

export const DEDUPE_WINDOW_MS = 60_000;
export const RATE_WINDOW_MS = 60_000;
export const RATE_MAX_PER_WINDOW = 10;

export interface ClientErrorInsert {
  user_id: string;
  route: string;
  error_type: ErrorReport['type'];
  message: string;
  stack: string | null;
  user_agent: string | null;
  correlation_id: string | null;
}

const seen = new Map<string, number>();
let windowStart = 0;
let windowCount = 0;

/** Só para testes: zera o estado de dedupe/limite. */
export function resetErrorReporterState(): void {
  seen.clear();
  windowStart = 0;
  windowCount = 0;
}

export function truncate(value: string | null | undefined, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/** `true` quando o relato deve ser gravado (fora da janela de dedupe e do teto). */
export function shouldCapture(key: string, now: number = Date.now()): boolean {
  const last = seen.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;

  if (now - windowStart >= RATE_WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  if (windowCount >= RATE_MAX_PER_WINDOW) return false;

  windowCount += 1;
  seen.set(key, now);

  if (seen.size > 200) {
    for (const [k, t] of seen) {
      if (now - t >= DEDUPE_WINDOW_MS) seen.delete(k);
    }
  }
  return true;
}

export function routeFromUrl(url: string | undefined): string {
  const fallback = '/';
  if (!url) return fallback;
  try {
    const { pathname } = new URL(url, 'http://localhost');
    return truncate(pathname, CLIENT_ERROR_ROUTE_MAX) ?? fallback;
  } catch {
    return truncate(url.split('?')[0].split('#')[0], CLIENT_ERROR_ROUTE_MAX) ?? fallback;
  }
}

/**
 * Monta a linha de `client_errors`. Devolve `null` sem usuario: a policy de
 * INSERT exige `auth.uid() = user_id`.
 */
export function buildClientErrorRow(
  report: ErrorReport,
  userId: string | null,
  correlationId: string | undefined = getTraceId(),
): ClientErrorInsert | null {
  if (!userId) return null;
  const message = truncate(report.message, CLIENT_ERROR_MESSAGE_MAX);
  if (!message) return null;
  return {
    user_id: userId,
    route: routeFromUrl(report.url),
    error_type: report.type,
    message,
    stack: truncate(report.stack, CLIENT_ERROR_STACK_MAX),
    user_agent: truncate(report.userAgent, CLIENT_ERROR_USER_AGENT_MAX),
    correlation_id: truncate(correlationId, CLIENT_ERROR_CORRELATION_MAX),
  };
}

async function persistReport(report: ErrorReport): Promise<void> {
  if (!shouldCapture(`${report.type}|${report.message}`)) return;

  const { data } = await supabase.auth.getSession();
  const row = buildClientErrorRow(report, data.session?.user?.id ?? null);
  if (!row) return;

  const { error } = await supabase.from('client_errors').insert(row);
  if (error) {
    console.warn('[ErrorReporter] Falha ao gravar client_errors:', error.message);
  }
}

/** Liga o reporter. Idempotente: chamar duas vezes nao duplica gravacoes. */
export function installErrorReporter(): void {
  if (typeof window === 'undefined') return;
  setErrorSink((report) => {
    void persistReport(report).catch((e) => {
      console.warn('[ErrorReporter] Erro ao persistir relato:', e);
    });
  });
}