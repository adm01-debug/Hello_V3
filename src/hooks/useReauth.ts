import { useReauthContext, type ReauthAction } from '@/contexts/ReauthContext';

export type { ReauthAction };
export { REAUTH_TIMEOUT_MS, REAUTH_GRANT_TTL_MS } from '@/contexts/ReauthContext';

/**
 * Fachada de compatibilidade sobre o ReauthContext.
 * O estado (e o grant assinado em sessionStorage) vive no provider,
 * garantindo um unico dialogo de reautenticacao para toda a aplicacao.
 */
export function useReauth() {
  return useReauthContext();
}