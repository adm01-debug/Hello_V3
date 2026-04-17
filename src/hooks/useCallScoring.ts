import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Recommendation } from '@/lib/outbound-scoring';

const log = logger.create('useCallScoring');

export interface CallScoreResult {
  score: number;
  recommendation: Recommendation;
  factors: string[];
  dnc: boolean;
  within_hours: boolean;
  computed_at: string;
}

export interface ScoreCallInput {
  phone: string;
  contact_id?: string;
  region_code?: string;
}

export function useCallScoring() {
  const scoreMutation = useMutation({
    mutationFn: async (input: ScoreCallInput): Promise<CallScoreResult> => {
      const { data, error } = await supabase.functions.invoke('score-call-attempt', { body: input });
      if (error) throw error;
      return data as CallScoreResult;
    },
    onError: (err: Error) => log.error('Falha ao calcular score', err),
  });

  return {
    score: scoreMutation.mutateAsync,
    lastResult: scoreMutation.data ?? null,
    isScoring: scoreMutation.isPending,
  };
}
