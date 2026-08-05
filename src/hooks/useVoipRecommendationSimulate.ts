import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipRecommendationSimulate');

export interface SimulateInput {
  recommendationId: string;
  mos?: number;
  jitter?: number;
  packetLoss?: number;
}

export interface SimulateResult {
  recommendationId: string;
  delta: { mos?: number; jitter?: number; packetLoss?: number };
  baseline: {
    avgMos: number | null;
    avgJitter: number | null;
    avgPacketLoss: number | null;
    totalAlerts: number;
    poorAlerts: number;
    sampleSize: number;
    uniqueAgents: number;
  };
  projected: {
    avgMos: number | null;
    avgJitter: number | null;
    avgPacketLoss: number | null;
    alertsAvoided: number;
    affectedUsersPct: number;
  };
  requestId: string;
}

export function useVoipRecommendationSimulate() {
  return useMutation<SimulateResult, Error, SimulateInput>({
    mutationFn: async (input) => {
      return await withTrace('voip.recommendation-simulate', async () => {
        const { data, error } = await supabase.functions.invoke('voip-recommendation-simulate', {
          method: 'POST',
          headers: traceHeaders(),
          body: input,
        });
        if (error) {
          log.error('Falha ao simular recomendação', error);
          throw error;
        }
        return data as SimulateResult;
      });
    },
  });
}
