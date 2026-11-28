/**
 * Token de cron conferido no banco (Vault), nao em env var da edge.
 *
 * Por que existe: os crons de 2026-11-22 guardam o mesmo segredo em dois lugares
 * (Vault + env var da edge) e um par fora de sincronia derruba o job em 401
 * silencioso -- a purga de optimistic_lock_conflicts ficou anos assim
 * (supabase/config.toml:1-8). Aqui o unico dono do segredo e o Vault: o job manda
 * `Bearer <valor>` e a edge pergunta a public.token_cron_valido() se vale.
 *
 * Contrato SQL: public.token_cron_valido(p_nome text, p_token text) -> boolean,
 * SECURITY DEFINER, executavel apenas por postgres/service_role
 * (supabase/migrations/20261128110000_crm_sync_queue_cron.sql).
 */

/** Nome do segredo no Vault que guarda o token do job da fila do CRM. */
export const SEGREDO_CRON_FILA_CRM = 'crm_sync_cron_token';

/** Extrai o token de `Authorization: Bearer <token>`; null se o header nao serve. */
export function tokenDoBearer(authHeader: string | null | undefined): string | null {
  const prefixo = 'Bearer ';
  if (!authHeader || !authHeader.startsWith(prefixo)) return null;
  const token = authHeader.slice(prefixo.length).trim();
  return token.length > 0 ? token : null;
}

interface ClienteRpc {
  rpc: (
    fn: string,
    args: Record<string, string>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * true so quando o banco confirma que o token e o segredo do cron.
 * Erro de rede, RPC ausente ou token vazio devolvem false: o chamador cai no
 * caminho de sessao (usuario logado) em vez de abrir a funcao.
 */
export async function tokenCronValido(
  client: ClienteRpc,
  token: string | null,
  nome: string = SEGREDO_CRON_FILA_CRM,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { data, error } = await client.rpc('token_cron_valido', {
      p_nome: nome,
      p_token: token,
    });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}