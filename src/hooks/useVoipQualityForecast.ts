import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';

export type ForecastHorizon = 24 | 72 | 168;

export interface ForecastPoint {
  ts: string;
  hour_offset: number;
  mos_predicted: number;
  mos_lower: number;
  mos_upper: number;
  jitter_predicted: number;
  volume_predicted: number;
  is_risk: boolean;
  risk_reason?: string;
}

export interface QualityForecastPayload {
  horizon_hours: number;
  generated_at: string;
  history_points: number;
  forecast: ForecastPoint[];
  summary: {
    avg_mos_predicted: number;
    risk_windows: number;
    p95_volume_historical: number;
    trend_slope_mos: number;
  };
  insufficient_data?: boolean;
}

export function useVoipQualityForecast(horizon: ForecastHorizon = 24) {
  return useQuery({
    queryKey: ['voip-quality-forecast', horizon],
    queryFn: async () =>
      withTrace('voip.quality-forecast', async () => {
        const { data, error } = await supabase.functions.invoke('voip-quality-forecast', {
          headers: traceHeaders(),
          body: undefined,
          method: 'GET' as never,
        });
        // supabase.functions.invoke não aceita query params nativos via SDK; usamos fetch
        if (error) throw error;
        return data as QualityForecastPayload;
      }),
    staleTime: 1000 * 60 * 10,
  });
}

// Versão alternativa que usa fetch direto para passar query params
export function useVoipQualityForecastFetch(horizon: ForecastHorizon = 24) {
  return useQuery({
    queryKey: ['voip-quality-forecast-fetch', horizon],
    queryFn: async () =>
      withTrace('voip.quality-forecast', async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Sem sessão');
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-quality-forecast?horizon=${horizon}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}`, ...traceHeaders() },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as QualityForecastPayload;
      }),
    staleTime: 1000 * 60 * 10,
  });
}
