import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['call-quality-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_quality_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as QualityMetric[];
    },
    refetchInterval: 5000,
  });
}

export function useTrunkUsageMetrics() {
  return useQuery({
    queryKey: ['voip-trunk-usage-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_trunk_usage_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as TrunkUsageMetric[];
    },
    refetchInterval: 10000,
  });
}
