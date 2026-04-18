import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipRecommendationInsights');

export type InsightsPeriod = 'week' | 'month';

export interface VoipRecommendationInsights {
  period: InsightsPeriod;
  since: string;
  effectivenessPct: number | null;
  effectivenessSampleSize: number;
  recurringCategories: Array<{ category: string; count: number }>;
  topProblematic: Array<{ category: string; unresolved: number; severity: string }>;
  pendingSnoozed: number;
  heatmap: Array<{ dow: number; hour: number; count: number }>;
  totals: { applied: number; autoApplied: number; snoozed: number; dismissed: number };
  requestId: string;
}

export function useVoipRecommendationInsights(period: InsightsPeriod = 'week') {
  return useQuery<VoipRecommendationInsights>({
    queryKey: ['voip-recommendation-insights', period],
    queryFn: async () => {
      return await withTrace('voip.recommendation-insights', async () => {
        const { data, error } = await supabase.functions.invoke('voip-recommendation-insights', {
          method: 'GET',
          headers: traceHeaders(),
          body: undefined,
          // @ts-expect-error supabase-js v2 aceita query
          query: { period },
        });
        if (error) {
          log.error('Falha ao carregar insights de recomendações', error);
          throw error;
        }
        return data as VoipRecommendationInsights;
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      const status = (error as { status?: number } | undefined)?.status;
      if (status && [401, 403, 404].includes(status)) return false;
      return failureCount < 2;
    },
  });
}
