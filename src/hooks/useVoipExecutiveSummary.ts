import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipExecutiveSummary');

export type ExecutivePeriod = 'day' | 'week' | 'month';

export interface ExecutiveBreakdown {
  sla_score: number;
  mos_score: number;
  alerts_score: number;
  capacity_score: number;
}

export interface ExecutiveAgentStat {
  agent_name: string;
  calls: number;
  mos_avg: number;
}

export interface ExecutiveSummary {
  period: ExecutivePeriod;
  since: string;
  health_score: number;
  breakdown: ExecutiveBreakdown;
  sla: {
    current_pct: number | null;
    previous_pct: number | null;
    delta_pct: number | null;
    total_calls: number;
  };
  mos_avg: number | null;
  alerts: { total: number; unacknowledged: number };
  capacity: { peak_concurrent: number; cap: number; utilization_pct: number };
  worst_agents: ExecutiveAgentStat[];
  requestId: string;
}

export function useVoipExecutiveSummary(period: ExecutivePeriod = 'week') {
  return useQuery<ExecutiveSummary>({
    queryKey: ['voip-executive-summary', period],
    queryFn: async () => {
      return await withTrace('voip.executive-summary', async () => {
        const { data, error } = await supabase.functions.invoke('voip-executive-summary', {
          method: 'GET',
          headers: traceHeaders(),
          body: undefined,
          // @ts-expect-error supabase-js v2 aceita query via path
          query: { period },
        });
        if (error) {
          log.error('Falha ao carregar resumo executivo', error);
          throw error;
        }
        return data as ExecutiveSummary;
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
