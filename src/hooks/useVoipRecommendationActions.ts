import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipRecommendationActions');

export type RecommendationOutcome = 'applied' | 'snoozed' | 'dismissed' | 'auto_applied';

export interface RecommendationActionInput {
  recommendation_id: string;
  category: string;
  severity: string;
  action_type: string;
  action_payload?: Record<string, unknown>;
  outcome: RecommendationOutcome;
  notes?: string;
}

/**
 * Registra a acao do usuario sobre uma recomendacao de VoIP em
 * `voip_recommendation_actions`. Devolve false quando nao conseguiu gravar,
 * para que a tela nao afirme sucesso sem linha no banco.
 */
export function useRecordVoipRecommendationAction() {
  const queryClient = useQueryClient();

  return useCallback(
    async (input: RecommendationActionInput): Promise<boolean> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          log.warn('Sem usuario autenticado; acao nao registrada', {
            recommendation_id: input.recommendation_id,
          });
          return false;
        }

        const { error } = await supabase.from('voip_recommendation_actions').insert([{
          user_id: userId,
          recommendation_id: input.recommendation_id,
          category: input.category,
          severity: input.severity,
          action_type: input.action_type,
          action_payload: (input.action_payload ?? {}) as never,
          outcome: input.outcome,
          notes: input.notes ?? null,
        }]);
        if (error) throw error;

        void queryClient.invalidateQueries({ queryKey: ['voip-recommendation-history'] });
        return true;
      } catch (err) {
        log.warn('Falha ao registrar acao no historico', err);
        return false;
      }
    },
    [queryClient],
  );
}
