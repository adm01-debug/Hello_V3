/**
 * Detecção central de sessão expirada.
 *
 * Um JWT vencido chega em formatos diferentes dependendo da camada: PostgREST
 * devolve `{ code: 'PGRST301', message: 'JWT expired' }`, o `fetch` do
 * supabase-js devolve `{ status: 401 }` e as edge functions devolvem 401 com
 * mensagem própria. Sem um detector único, cada tela trata como erro genérico e
 * o usuário não descobre que basta entrar de novo.
 */
export const SESSION_EXPIRED_EVENT = 'app:session-expired';

const EXPIRED_MESSAGE = /jwt expired|invalid jwt|token (?:has )?expired|sess[aã]o expirada/i;

export function isSessionExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown };
  if (candidate.status === 401) return true;
  if (candidate.code === 'PGRST301' || candidate.code === 'invalid_jwt') return true;
  return typeof candidate.message === 'string' && EXPIRED_MESSAGE.test(candidate.message);
}

/**
 * Avisa o ponto único de recuperação sem acoplar o React Query ao React.
 * Quem escuta mantém a rota montada e abre o diálogo de reautenticação.
 */
export function notifySessionExpired(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
