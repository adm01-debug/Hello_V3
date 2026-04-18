import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { logger } from '@/lib/logger';

const log = logger.create('useVoipExecutiveNarrative');

export type NarrativePeriod = 'week' | 'month';

export interface ExecKpis {
  mosAvg: number | null;
  totalCalls: number;
  totalAlerts: number;
  criticalAlerts: number;
  appliedActions: number;
  effectivenessPct: number | null;
}

export interface ExecutiveNarrativeResult {
  summary: string;
  kpis: ExecKpis;
  topApplied: Array<{ category: string; count: number }>;
  pendingHints: string[];
  generatedAt: string;
  period: NarrativePeriod;
  requestId: string;
}

export function useVoipExecutiveNarrative(period: NarrativePeriod, enabled = false) {
  return useQuery<ExecutiveNarrativeResult>({
    queryKey: ['voip-executive-narrative', period],
    enabled,
    queryFn: async () => {
      return await withTrace('voip.executive-narrative', async () => {
        const { data, error } = await supabase.functions.invoke('voip-executive-narrative', {
          headers: traceHeaders(),
          body: { period },
        });
        if (error) {
          log.error('Falha no resumo executivo IA', error);
          throw error;
        }
        return data as ExecutiveNarrativeResult;
      });
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, err: unknown) => {
      const status = (err as { status?: number } | undefined)?.status;
      if (status && [401, 402, 403, 404, 429].includes(status)) return false;
      return failureCount < 1;
    },
  });
}
