import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import type { ForecastHorizon } from './useVoipQualityForecast';

export interface CapacityRecommendation {
  id: string;
  action_type: 'add_agents' | 'pause_campaign' | 'shift_codec' | 'preheat_warmup';
  title: string;
  description: string;
  window_start: string;
  window_end: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  evidence: { mos_predicted?: number; volume_predicted?: number; risk_reason?: string };
}

export interface CapacityPayload {
  recommendations: CapacityRecommendation[];
  confidence: number;
  generated_at: string;
  insufficient_data?: boolean;
}

export function useVoipCapacityRecommendations(horizon: ForecastHorizon = 24) {
  return useQuery({
    queryKey: ['voip-capacity-recommendations', horizon],
    queryFn: async () =>
      withTrace('voip.capacity-recommendations', async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sem sessão');
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-capacity-recommendations?horizon=${horizon}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}`, ...traceHeaders() },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as CapacityPayload;
      }),
    staleTime: 1000 * 60 * 15,
  });
}
