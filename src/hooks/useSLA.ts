import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { toast } from 'sonner';

export interface SlaPolicy {
  id: string;
  name: string;
  description: string | null;
  channel: string | null;
  priority: string | null;
  first_response_minutes: number;
  resolution_minutes: number;
  business_hours_only: boolean;
  is_active: boolean;
  applies_to_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SlaComplianceRow {
  id: string;
  sla_breached: boolean | null;
  status: string | null;
  channel: string | null;
  created_at: string;
}

export function useSlaPolicies() {
  return useQuery({
    queryKey: ['sla-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_policies')
        .select('*')
        .order('priority', { ascending: true });
      if (error) {
        logger.error('useSlaPolicies.fetch', { error });
        throw error;
      }
      return (data ?? []) as SlaPolicy[];
    },
  });
}

export function useSlaCompliance() {
  return useQuery({
    queryKey: ['sla-compliance'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('conversations')
        .select('id, sla_breached, status, channel, created_at')
        .gte('created_at', since)
        .limit(2000);
      if (error) {
        logger.error('useSlaCompliance.fetch', { error });
        throw error;
      }
      const total = data?.length ?? 0;
      const rows = (data ?? []) as SlaComplianceRow[];
      const breaches = rows.filter((c) => c.sla_breached);
      const breached = breaches.length;
      const compliancePct = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

      const byChannel: Record<string, { total: number; breached: number }> = {};
      for (const c of rows) {
        const ch = c.channel ?? 'unknown';
        if (!byChannel[ch]) byChannel[ch] = { total: 0, breached: 0 };
        byChannel[ch].total++;
        if (c.sla_breached) byChannel[ch].breached++;
      }

      return { total, breached, compliancePct, byChannel, breaches };
    },
  });
}

export function useUpsertSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<SlaPolicy> & { name: string }) => {
      const { data, error } = await supabase
        .from('sla_policies')
        .upsert(policy as never)
        .select()
        .single();
      if (error) throw error;
      return data as SlaPolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast.success('Política SLA salva');
    },
    onError: (err) => {
      logger.error('useUpsertSlaPolicy.error', { err });
      toast.error('Falha ao salvar política');
    },
  });
}

export interface SlaViolationRow {
  id: string;
  channel: string;
  priority: string;
  status: string;
  created_at: string;
  first_response_at: string | null;
  sla_first_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  resolved_at: string | null;
  assigned_agent_name: string | null;
  contacts: { name: string | null; phone: string | null } | null;
}

export interface SlaViolationFilters {
  days: number;
  channel: string;
  onlyOpen: boolean;
  page: number;
}

export const SLA_VIOLATIONS_PAGE_SIZE = 20;
export const SLA_OPEN_STATUSES = ['open', 'pending'];

type BreachInput = {
  sla_first_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
};

export type SlaBreachKind = 'first_response' | 'resolution' | 'unknown';

/**
 * Classifica o prazo estourado de uma conversa marcada como sla_breached.
 * A coluna `sla_breached` sozinha não diz qual dos dois prazos venceu — isso
 * importa para saber se o problema foi demora em atender ou em concluir.
 */
export function describeSlaBreach(row: BreachInput, now: number = Date.now()): {
  kind: SlaBreachKind;
  dueAt: string | null;
  delayMinutes: number | null;
} {
  const diff = (end: string | null, due: string | null): number | null => {
    if (!due) return null;
    const dueMs = new Date(due).getTime();
    const endMs = end ? new Date(end).getTime() : now;
    if (Number.isNaN(dueMs) || Number.isNaN(endMs)) return null;
    return Math.max(0, Math.round((endMs - dueMs) / 60000));
  };

  const firstResponseDelay = diff(row.first_response_at, row.sla_first_response_due_at);
  if (firstResponseDelay !== null && firstResponseDelay > 0) {
    return { kind: 'first_response', dueAt: row.sla_first_response_due_at, delayMinutes: firstResponseDelay };
  }
  const resolutionDelay = diff(row.resolved_at, row.sla_resolution_due_at);
  if (resolutionDelay !== null && resolutionDelay > 0) {
    return { kind: 'resolution', dueAt: row.sla_resolution_due_at, delayMinutes: resolutionDelay };
  }
  // Marcada como violada mas sem prazo vencido calculável: mantém o rótulo genérico
  // em vez de inventar um atraso que o banco não registrou.
  return {
    kind: 'unknown',
    dueAt: row.sla_resolution_due_at ?? row.sla_first_response_due_at,
    delayMinutes: null,
  };
}

export function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours > 0 ? `${days} d ${restHours} h` : `${days} d`;
}

const VIOLATION_COLUMNS =
  'id, channel, priority, status, created_at, first_response_at, sla_first_response_due_at, sla_resolution_due_at, resolved_at, assigned_agent_name, contacts(name, phone)';

export function useSlaViolations({ days, channel, onlyOpen, page }: SlaViolationFilters) {
  return useQuery({
    queryKey: ['sla-violations', days, channel, onlyOpen, page],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const from = page * SLA_VIOLATIONS_PAGE_SIZE;
      let query = supabase
        .from('conversations')
        .select(VIOLATION_COLUMNS, { count: 'exact' })
        .eq('sla_breached', true)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .range(from, from + SLA_VIOLATIONS_PAGE_SIZE - 1);
      if (channel !== 'all') query = query.eq('channel', channel);
      if (onlyOpen) query = query.in('status', SLA_OPEN_STATUSES);

      const { data, error, count } = await query;
      if (error) {
        logger.error('useSlaViolations.fetch', { error });
        throw error;
      }
      return { rows: (data ?? []) as unknown as SlaViolationRow[], total: count ?? 0 };
    },
  });
}

export function useSlaViolationStats(days: number) {
  return useQuery({
    queryKey: ['sla-violations-stats', days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error, count } = await supabase
        .from('conversations')
        .select('id, channel, status, first_response_at, sla_first_response_due_at, sla_resolution_due_at, resolved_at', { count: 'exact' })
        .eq('sla_breached', true)
        .gte('created_at', since)
        .limit(2000);
      if (error) {
        logger.error('useSlaViolationStats.fetch', { error });
        throw error;
      }
      const rows = data ?? [];
      const now = Date.now();
      const open = rows.filter((r) => SLA_OPEN_STATUSES.includes(r.status ?? '')).length;
      const delays = rows
        .map((r) => describeSlaBreach(r, now).delayMinutes)
        .filter((d): d is number => d !== null);
      const byChannel: Record<string, number> = {};
      for (const r of rows) {
        const ch = r.channel ?? 'sem canal';
        byChannel[ch] = (byChannel[ch] ?? 0) + 1;
      }
      const topChannel = Object.entries(byChannel).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        total: count ?? rows.length,
        open,
        avgDelayMinutes: delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0,
        byChannel,
        topChannel,
      };
    },
  });
}

/** Dispara enforcement do SLA (varredura de breaches). Tracing propagado. */
export function useEnforceSla() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await withTrace('sla.enforce', () =>
        supabase.functions.invoke('enforce-sla', { headers: traceHeaders() }),
      );
      if (error) throw error;
      return data as { evaluated: number; breached: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sla-compliance'] });
      toast.success(`SLA enforced: ${data?.evaluated ?? 0} avaliadas, ${data?.breached ?? 0} em breach`);
    },
    onError: (err) => {
      logger.error('useEnforceSla.error', { err });
      toast.error('Falha ao executar enforcement de SLA');
    },
  });
}
