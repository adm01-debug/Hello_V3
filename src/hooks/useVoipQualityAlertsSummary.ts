import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipQualityAlertsSummary');

export type AlertsSummaryPeriod = 'day' | 'week' | 'month';

export interface VoipQualityAlertsSummary {
  period: AlertsSummaryPeriod;
  since: string;
  total: number;
  unacknowledged: number;
  by_type: Record<string, number>;
  top_users: Array<{ user_id: string; count: number }>;
  mos_avg_at_alert: number | null;
  requestId: string;
}

/** Resumo agregado de voip_quality_alerts (contagem por tipo, top usuários, MOS médio). */
export function useVoipQualityAlertsSummary(period: AlertsSummaryPeriod = 'week') {
  return useQuery<VoipQualityAlertsSummary>({
    queryKey: ['voip-quality-alerts-summary', period],
    queryFn: async () => {
      return await withTrace('voip.quality-alerts-summary', async () => {
        // supabase-js (FunctionsClient.invoke) não tem opção `query`: monta a querystring no
        // próprio nome da function, que o cliente concatena direto na URL (`${url}/${functionName}`).
        const { data, error } = await supabase.functions.invoke(
          `voip-quality-alerts-summary?period=${encodeURIComponent(period)}`,
          { method: 'GET', headers: traceHeaders(), body: undefined },
        );
        if (error) {
          log.error('Falha ao carregar resumo de alertas de qualidade', error);
          throw error;
        }
        return data as VoipQualityAlertsSummary;
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
