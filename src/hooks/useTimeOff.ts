import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TimeOffRequest {
  id: string;
  agent_name: string;
  start_date: string;
  end_date: string;
  request_type: string;
  reason: string | null;
  status: string;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useTimeOff() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['time_off_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TimeOffRequest[];
    },
  });

  const create = useMutation({
    mutationFn: async (req: Pick<TimeOffRequest, 'agent_name' | 'start_date' | 'end_date' | 'request_type' | 'reason'>) => {
      const { data, error } = await supabase.from('time_off_requests').insert(req).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['time_off_requests'] }); toast.success('Solicitação enviada'); },
    onError: (e) => { logger.error('createTimeOff', e); toast.error('Erro ao solicitar folga'); },
  });

  const review = useMutation({
    mutationFn: async ({ id, status, reviewer_notes }: { id: string; status: 'approved' | 'rejected'; reviewer_notes?: string }) => {
      const { data, error } = await supabase
        .from('time_off_requests')
        .update({ status, reviewer_notes, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['time_off_requests'] }); toast.success('Solicitação revisada'); },
    onError: (e) => { logger.error('reviewTimeOff', e); toast.error('Erro ao revisar'); },
  });

  return {
    requests: list.data ?? [],
    isLoading: list.isLoading,
    create: create.mutate,
    review: review.mutate,
  };
}
