import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipRecommendations');

export type RecPeriod = 'day' | 'week';
export type RecSeverity = 'info' | 'warning' | 'critical';
export type RecCategory = 'capacity' | 'quality' | 'infra' | 'process';
export type RecActionType = 'link' | 'function' | 'acknowledge';

export interface VoipRecommendation {
  id: string;
  severity: RecSeverity;
  category: RecCategory;
  title: string;
  description: string;
  impact_estimate: string;
  action_type: RecActionType;
  action_label: string;
  action_payload: Record<string, unknown>;
  priority_score: number;
}

export interface VoipRecommendationsResponse {
  period: RecPeriod;
  since: string;
  recommendations: VoipRecommendation[];
  total: number;
  context: {
    slaPct: number | null;
    avgMos: number | null;
    avgJitter: number | null;
    unackAlerts: number;
    totalAlerts: number;
    peakConcurrent: number;
    worstAgent: { name: string; mos: number; calls: number } | null;
    totalCalls: number;
  };
  requestId: string;
}

export function useVoipRecommendations(period: RecPeriod = 'week') {
  return useQuery<VoipRecommendationsResponse>({
    queryKey: ['voip-recommendations', period],
    queryFn: async () => {
      return await withTrace('voip.recommendations', async () => {
        const { data, error } = await supabase.functions.invoke('voip-recommendations', {
          method: 'GET',
          headers: traceHeaders(),
          body: undefined,
          // @ts-expect-error supabase-js v2 aceita query
          query: { period },
        });
        if (error) {
          log.error('Falha ao carregar recomendações', error);
          throw error;
        }
        return data as VoipRecommendationsResponse;
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
