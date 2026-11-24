import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePageVisibility } from '@/hooks/usePageVisibility';

const COLUNAS_QUALIDADE =
  'id, call_session_id, agent_name, mos_avg, jitter_avg_ms, packet_loss_pct, rtt_avg_ms, quality_label, created_at';
const COLUNAS_TRONCO = 'id, trunk_id, duration_seconds, was_failover, created_at';

export interface QualityMetric {
  id: string;
  call_session_id: string;
  agent_name: string;
  mos_avg: number;
  jitter_avg_ms: number;
  packet_loss_pct: number;
  rtt_avg_ms: number;
  quality_label: string;
  created_at: string;
}

export interface TrunkUsageMetric {
  id: string;
  trunk_id: string;
  duration_seconds: number;
  was_failover: boolean;
  created_at: string;
}

export function useQualityMetrics() {
  const isVisible = usePageVisibility();
  return useQuery({
    queryKey: ['call-quality-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_quality_metrics')
        .select(COLUNAS_QUALIDADE)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as unknown as QualityMetric[];
    },
    // Aba oculta: sem poll. `refetchIntervalInBackground` sozinho nao basta —
    // ele nao impede o intervalo, so o refetch de query sem observer focado.
    refetchInterval: isVisible ? 5000 : false,
  });
}

export function useTrunkUsageMetrics() {
  const isVisible = usePageVisibility();
  return useQuery({
    queryKey: ['voip-trunk-usage-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_trunk_usage_metrics')
        .select(COLUNAS_TRONCO)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as unknown as TrunkUsageMetric[];
    },
    refetchInterval: isVisible ? 10000 : false,
  });
}
