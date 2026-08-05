import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

const log = logger.create('BitrixSync');

/** Status possíveis de uma tentativa de sincronização. */
export type SyncAttemptStatus = 'in_progress' | 'success' | 'failed' | 'pending';

export interface SyncAttempt {
  id: string;
  action: string;
  status: SyncAttemptStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  payload: Json | null;
}

/**
 * Cria um registro "em progresso" na fila `crm_sync_queue`.
 * Retorna o id, ou null se o INSERT for barrado (ex.: RLS para não-admin).
 */
export async function startSyncAttempt(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<string | null> {
  const { data, error } = await supabase
    .from('crm_sync_queue')
    .insert({
      action,
      payload: payload as unknown as Json,
      status: 'in_progress',
      attempts: 1,
    })
    .select('id')
    .single();

  if (error) {
    log.warn('startSyncAttempt insert falhou', { action, error: error.message });
    return null;
  }
  return data.id;
}

/** Marca a tentativa como sucesso. */
export async function markSyncSuccess(id: string | null): Promise<void> {
  if (!id) return;
  const { error } = await supabase
    .from('crm_sync_queue')
    .update({ status: 'success', last_error: null })
    .eq('id', id);
  if (error) log.warn('markSyncSuccess falhou', { id, error: error.message });
}

/** Marca a tentativa como falha e registra a mensagem de erro. */
export async function markSyncFailure(
  id: string | null,
  err: unknown,
): Promise<void> {
  if (!id) return;
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
  const { error } = await supabase
    .from('crm_sync_queue')
    .update({ status: 'failed', last_error: message.slice(0, 2000) })
    .eq('id', id);
  if (error) log.warn('markSyncFailure falhou', { id, error: error.message });
}

/** Rótulo humano para cada ação registrada na fila. */
export const actionLabel = (action: string): string => {
  switch (action) {
    case 'sync_agents':
      return 'Sincronizar agentes';
    case 'sync_departments':
      return 'Sincronizar departamentos';
    case 'create_lead':
      return 'Criar lead';
    case 'register_call':
      return 'Registrar chamada';
    case 'finish_call':
      return 'Finalizar chamada';
    case 'check_configuration':
      return 'Testar conexão';
    default:
      return action.replace(/_/g, ' ');
  }
};
