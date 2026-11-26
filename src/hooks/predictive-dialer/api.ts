import { supabase } from '@/integrations/supabase/client';
import type {
  AddToQueueInput,
  CreateCampaignInput,
  DialerCampaign,
  DialerQueueItem,
} from './types';

export async function apiFetchCampaigns(): Promise<DialerCampaign[]> {
  const { data, error } = await supabase
    .from('dialer_campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as DialerCampaign[];
}

export async function apiFetchQueue(campaignId: string): Promise<DialerQueueItem[]> {
  const { data, error } = await supabase
    .from('dialer_queue')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as DialerQueueItem[];
}

export async function apiCreateCampaign(input: CreateCampaignInput): Promise<DialerCampaign> {
  const { data, error } = await supabase
    .from('dialer_campaigns')
    .insert({
      name: input.name,
      description: input.description,
      mode: input.mode || 'predictive',
      max_concurrent_calls: input.max_concurrent_calls || 3,
      call_timeout_seconds: input.call_timeout_seconds || 30,
      retry_attempts: input.retry_attempts || 2,
      retry_delay_minutes: input.retry_delay_minutes || 30,
      working_hours_start: input.working_hours_start || '08:00:00',
      working_hours_end: input.working_hours_end || '18:00:00',
      created_by: input.created_by,
      status: input.status || 'paused',
    })
    .select()
    .single();
  if (error) throw error;
  return data as DialerCampaign;
}

export async function apiAddToQueue(items: AddToQueueInput[]): Promise<void> {
  const { error } = await supabase.from('dialer_queue').insert(
    items.map((item) => ({
      campaign_id: item.campaign_id,
      phone: item.phone,
      name: item.name,
      contact_id: item.contact_id || null,
      priority: item.priority || 0,
      status: 'pending',
    })),
  );
  if (error) throw error;
}

export async function apiUpdateCampaignTotal(campaignId: string, total: number): Promise<void> {
  const { error } = await supabase
    .from('dialer_campaigns')
    .update({ total_contacts: total })
    .eq('id', campaignId);
  if (error) throw error;
}

export async function apiStartCampaign(campaignId: string): Promise<DialerCampaign> {
  const { data, error } = await supabase
    .from('dialer_campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId)
    .select()
    .single();
  if (error) throw error;
  return data as DialerCampaign;
}

export async function apiPauseCampaign(campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('dialer_campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId);
  if (error) throw error;
}

/**
 * Etapa 079 (A-057): reivindica o proximo contato em **uma** operacao no banco
 * (`claim_next_dialer_contact`). Antes eram duas idas — SELECT `pending` e
 * depois UPDATE `dialing` sem condicao de status — e duas abas/dois agentes na
 * mesma campanha pegavam o **mesmo** contato, ligando duas vezes para o mesmo
 * cliente. `attempts` tambem passou a ser `attempts + 1` no SQL: antes vinha do
 * objeto em memoria e duas tentativas simultaneas viravam uma.
 */
export async function apiClaimNextContact(campaignId: string): Promise<DialerQueueItem | null> {
  const { data, error } = await supabase.rpc('claim_next_dialer_contact', {
    p_campaign_id: campaignId,
  });
  if (error) throw error;
  const rows = (data ?? []) as unknown as DialerQueueItem[];
  return rows[0] ?? null;
}

/**
 * Contato pulado pela barreira de compliance. Fica com rastro auditavel em
 * `dialer_queue` (a coluna `result` guarda o motivo) e sai da fila de discagem,
 * em vez de sumir sem registro.
 */
export async function apiMarkSkipped(item: DialerQueueItem, reason: string): Promise<void> {
  const { error } = await supabase
    .from('dialer_queue')
    .update({
      status: 'skipped',
      result: `compliance: ${reason}`,
    })
    .eq('id', item.id);
  if (error) throw error;
}

export async function apiUpdateQueueItem(
  id: string,
  patch: Partial<DialerQueueItem>,
): Promise<void> {
  const { error } = await supabase.from('dialer_queue').update(patch).eq('id', id);
  if (error) throw error;
}

export async function apiUpdateCampaignStats(
  campaignId: string,
  completed: number,
  successful: number,
): Promise<void> {
  const { error } = await supabase
    .from('dialer_campaigns')
    .update({ completed_contacts: completed, successful_contacts: successful })
    .eq('id', campaignId);
  if (error) throw error;
}

export async function apiDeleteCampaign(campaignId: string): Promise<void> {
  const { error } = await supabase.from('dialer_campaigns').delete().eq('id', campaignId);
  if (error) throw error;
}

export async function apiRemoveFromQueue(id: string): Promise<void> {
  const { error } = await supabase.from('dialer_queue').delete().eq('id', id);
  if (error) throw error;
}
