import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VolumeForecastSlot {
  day_of_week: number;
  hour: number;
  expected_calls: number;
  required_agents: number;
}

export interface VolumeForecastSummary {
  total_calls_28d: number;
  avg_daily: number;
  peak_hour: VolumeForecastSlot;
  total_required_agent_hours: number;
}

export function useForecastVolume() {
  return useQuery({
    queryKey: ['forecast_call_volume'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('forecast-call-volume');
      if (error) throw error;
      return data as { forecast: VolumeForecastSlot[]; summary: VolumeForecastSummary };
    },
    staleTime: 1000 * 60 * 30,
  });
}
