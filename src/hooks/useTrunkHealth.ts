import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TrunkHealthCheck {
  id: string;
  trunk_id: string;
  checked_at: string;
  reachable: boolean;
  latency_ms: number | null;
  error_message: string | null;
}

export function useTrunkHealthHistory(trunkId: string | null, hours = 24) {
  return useQuery({
    queryKey: ['trunk-health-history', trunkId, hours],
    queryFn: async () => {
      if (!trunkId) return [] as TrunkHealthCheck[];
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('voip_trunk_health_checks')
        .select('*')
        .eq('trunk_id', trunkId)
        .gte('checked_at', since)
        .order('checked_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TrunkHealthCheck[];
    },
    enabled: !!trunkId,
    staleTime: 30 * 1000,
  });
}

export function useRunHealthCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('voip-trunks-healthcheck', { body: {} });
      if (error) throw error;
      return data as { checked: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['voip-trunks'] });
      qc.invalidateQueries({ queryKey: ['trunk-health-history'] });
      toast.success(`Health check executado em ${data.checked} trunks`);
    },
    onError: (err: Error) => {
      logger.error('Falha ao executar health check', err);
      toast.error('Falha no health check', { description: err.message });
    },
  });
}
