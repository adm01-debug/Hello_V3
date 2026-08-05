import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipRecommendationHistory');

export type HistoryPeriod = 'day' | 'week' | 'month';
export type HistoryOutcome = 'applied' | 'snoozed' | 'dismissed' | 'auto_applied';

export interface VoipRecommendationActionItem {
  id: string;
  user_id: string;
  recommendation_id: string;
  category: string;
  severity: string;
  action_type: string;
  outcome: HistoryOutcome;
  applied_at: string;
  notes: string | null;
}

export interface VoipRecommendationHistoryResponse {
  period: HistoryPeriod;
  since: string;
  items: VoipRecommendationActionItem[];
  total: number;
  aggregations: {
    byCategory: Record<string, number>;
    byOutcome: Record<string, number>;
    perDay: Array<{ date: string; count: number }>;
  };
  requestId: string;
}

interface Options {
  period?: HistoryPeriod;
  limit?: 10 | 25 | 50 | 100;
  enabled?: boolean;
}

export function useVoipRecommendationHistory({ period = 'week', limit = 50, enabled = true }: Options = {}) {
  return useQuery<VoipRecommendationHistoryResponse>({
    queryKey: ['voip-recommendation-history', period, limit],
    enabled,
    queryFn: async () => {
      return await withTrace('voip.recommendation-history', async () => {
        const { data, error } = await supabase.functions.invoke('voip-recommendation-history', {
          method: 'GET',
          headers: traceHeaders(),
          body: undefined,
          // @ts-expect-error supabase-js v2 aceita query
          query: { period, limit: String(limit) },
        });
        if (error) {
          log.error('Falha ao carregar histórico de recomendações', error);
          throw error;
        }
        return data as VoipRecommendationHistoryResponse;
      });
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      const status = (error as { status?: number } | undefined)?.status;
      if (status && [401, 403, 404].includes(status)) return false;
      return failureCount < 2;
    },
  });
}
