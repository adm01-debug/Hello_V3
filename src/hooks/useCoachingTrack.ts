import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CoachingRules {
  min_samples: number;
  score_threshold: number;
  window_days: number;
}

export interface TrackResult {
  tracks_created: number;
  assignments: Array<{
    id: string;
    agent_name: string;
    title: string;
    priority: string;
    status: string;
  }>;
  skipped: Array<{ agent_name: string; reason: string }>;
  rules?: CoachingRules;
}

/** Regras vêm da edge (`generate-coaching-track`); o front nunca duplica as constantes. */
export const COACHING_RULES_QUERY_KEY = ['coaching_track_rules'];

export function useCoachingTrack() {
  const qc = useQueryClient();

  const cachedRules = useQuery<CoachingRules | null>({
    queryKey: COACHING_RULES_QUERY_KEY,
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });

  const generateTrack = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-coaching-track');
      if (error) throw error;
      return data as TrackResult;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['coaching_assignments'] });
      qc.invalidateQueries({ queryKey: ['coaching_recommendations'] });
      if (data.rules) qc.setQueryData(COACHING_RULES_QUERY_KEY, data.rules);
      const created = data.tracks_created ?? data.assignments?.length ?? 0;
      toast.success(created > 0 ? 'Trilhas de coaching geradas' : 'Nenhuma trilha gerada', {
        description:
          created > 0
            ? `${created} nova(s) trilha(s) criada(s).`
            : (data.skipped?.length ?? 0) > 0
              ? `Nenhuma nova trilha: ${data.skipped!.map((s) => s.reason).join('; ')}`
              : `Nenhuma chamada analisada nos últimos ${data.rules?.window_days ?? 0}d.`,
      });
    },
    onError: (e: Error) => {
      logger.error('generateCoachingTrack', e);
      toast.error('Erro ao gerar trilhas', { description: e.message });
    },
  });

  return {
    generateTrack: generateTrack.mutate,
    isGenerating: generateTrack.isPending,
    rules: cachedRules.data ?? null,
    lastResult: generateTrack.data ?? null,
  };
}
