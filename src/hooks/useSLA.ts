import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
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
      const breached = (data ?? []).filter((c) => c.sla_breached).length;
      const compliancePct = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

      const byChannel: Record<string, { total: number; breached: number }> = {};
      for (const c of data ?? []) {
        const ch = c.channel ?? 'unknown';
        if (!byChannel[ch]) byChannel[ch] = { total: 0, breached: 0 };
        byChannel[ch].total++;
        if (c.sla_breached) byChannel[ch].breached++;
      }

      return { total, breached, compliancePct, byChannel };
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
