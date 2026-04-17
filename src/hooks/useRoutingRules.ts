import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  channel: string | null;
  conditions: unknown;
  actions: unknown;
  priority: number;
  is_active: boolean;
  match_count: number;
  last_matched_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useRoutingRules() {
  return useQuery({
    queryKey: ['routing-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routing_rules')
        .select('*')
        .order('priority', { ascending: true });
      if (error) {
        logger.error('useRoutingRules.fetch', { error });
        throw error;
      }
      return (data ?? []) as RoutingRule[];
    },
  });
}

export function useUpsertRoutingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<RoutingRule> & { name: string }) => {
      const { data, error } = await supabase
        .from('routing_rules')
        .upsert(rule as never)
        .select()
        .single();
      if (error) throw error;
      return data as RoutingRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] });
      toast.success('Regra salva');
    },
    onError: (err) => {
      logger.error('useUpsertRoutingRule.error', { err });
      toast.error('Falha ao salvar regra');
    },
  });
}

export function useDeleteRoutingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routing_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] });
      toast.success('Regra removida');
    },
    onError: (err) => {
      logger.error('useDeleteRoutingRule.error', { err });
      toast.error('Falha ao remover regra');
    },
  });
}
