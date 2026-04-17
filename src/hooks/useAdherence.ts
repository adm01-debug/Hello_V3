import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdherenceData {
  scheduled_minutes: number;
  actual_minutes: number;
  adherence_percent: number;
  deviations: Array<{ type: string; minutes: number }>;
}

export function useAdherence(date?: string) {
  return useQuery({
    queryKey: ['adherence', date],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('compute-adherence', {
        body: { date: date || new Date().toISOString().split('T')[0] },
      });
      if (error) throw error;
      return data as { date: string; adherence: Record<string, AdherenceData> };
    },
    refetchInterval: 60000,
  });
}
