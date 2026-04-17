import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';

const log = logger.create('useBestTimeToContact');

export interface EngagementPattern {
  id: string;
  contact_id: string;
  best_hour: number | null;
  best_day_of_week: number | null;
  answer_rate: number;
  total_attempts: number;
  total_answered: number;
  avg_call_duration_seconds: number;
  last_attempt_at: string | null;
  last_answered_at: string | null;
  computed_at: string;
}

export function useBestTimeToContact(contactId?: string) {
  const qc = useQueryClient();

  const { data: pattern, isLoading } = useQuery({
    queryKey: ['engagement-pattern', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_engagement_patterns')
        .select('*')
        .eq('contact_id', contactId!)
        .maybeSingle();
      if (error) throw error;
      return data as EngagementPattern | null;
    },
  });

  const { data: topPatterns = [] } = useQuery({
    queryKey: ['engagement-patterns-top'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_engagement_patterns')
        .select('*')
        .gte('total_attempts', 3)
        .order('answer_rate', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as EngagementPattern[];
    },
  });

  const recomputeMutation = useMutation({
    mutationFn: async (targetId?: string) => {
      const { data, error } = await withTrace('best-time.compute', () =>
        supabase.functions.invoke('compute-best-time', {
          body: targetId ? { contact_id: targetId } : {},
          headers: traceHeaders(),
        }),
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['engagement-pattern'] });
      qc.invalidateQueries({ queryKey: ['engagement-patterns-top'] });
      toast.success('Padrões recalculados', { description: `${data?.processed ?? 0} contato(s) processado(s)` });
    },
    onError: (err: Error) => {
      log.error('Falha ao recomputar padrões', err);
      toast.error('Erro ao recomputar', { description: err.message });
    },
  });

  return {
    pattern,
    topPatterns,
    isLoading,
    recompute: recomputeMutation.mutate,
    isRecomputing: recomputeMutation.isPending,
  };
}
