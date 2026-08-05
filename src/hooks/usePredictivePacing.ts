import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface PacingSnapshot {
  campaign_id: string;
  current_pace: number;
  suggested_pace: number;
  free_agents: number;
  aht_seconds: number;
  connect_rate: number;
  abandon_rate: number;
  target_abandon_rate: number;
  reason: string;
  computed_at: string;
}

export function useCampaignPacing(campaignId: string | null) {
  return useQuery({
    queryKey: ['predictive-pacing', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const { data, error } = await supabase.rpc('calculate_predictive_pace', {
        p_campaign_id: campaignId,
      });
      if (error) throw error;
      return data as unknown as PacingSnapshot;
    },
    enabled: !!campaignId,
    refetchInterval: 15_000,
  });
}

export function useApplyPacingNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('dialer-pacing-tick', { body: {} });
      if (error) throw error;
      return data as { updated_count: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['predictive-pacing'] });
      qc.invalidateQueries({ queryKey: ['dialer-campaigns'] });
      toast.success(`Pacing ajustado em ${data.updated_count} campanha(s)`);
    },
    onError: (err: Error) => {
      logger.error('Falha ao aplicar pacing', err);
      toast.error('Falha ao aplicar pacing', { description: err.message });
    },
  });
}
