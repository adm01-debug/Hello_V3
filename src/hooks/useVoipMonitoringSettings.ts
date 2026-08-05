import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VoipMonitoringSettings {
  id: string;
  occupancy_threshold_percent: number;
  latency_threshold_ms: number;
  check_interval_seconds: number;
}

export function useVoipMonitoringSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['voip-monitoring-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_monitoring_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as VoipMonitoringSettings;
    }
  });

  const mutation = useMutation({
    mutationFn: async (settings: Partial<VoipMonitoringSettings>) => {
      if (query.data?.id) {
        const { data, error } = await supabase
          .from('voip_monitoring_settings')
          .update(settings)
          .eq('id', query.data.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('voip_monitoring_settings')
          .insert([settings])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voip-monitoring-settings'] });
      toast.success('Configurações salvas');
    }
  });

  return { settings: query.data, isLoading: query.isLoading, save: mutation.mutate };
}
