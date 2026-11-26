import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const DEAL_PIPELINE_TREND_QUERY_KEY = ['deal-pipeline-trend'] as const;

export const DEAL_PIPELINE_TREND_COLUMNS =
  'snapshot_date, open_count, total_value_cents, weighted_value_cents';

export interface DealPipelineSnapshot {
  snapshot_date: string;
  open_count: number;
  total_value_cents: number;
  weighted_value_cents: number;
}

export type PipelineTrendPeriod = 7 | 30 | 90;

export function pipelineTrendStartDate(days: number, now: Date = new Date()): string {
  const start = new Date(now.getTime() - Math.max(days - 1, 0) * 24 * 60 * 60 * 1000);
  return start.toISOString().slice(0, 10);
}

export function pipelineTrendDeltaPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

export function pipelineTrendDeltaTone(delta: number): 'up' | 'down' | 'flat' {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

export function pipelineTrendBarHeight(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(4, Math.round((value / max) * 100));
}

export function useDealPipelineTrend(days: PipelineTrendPeriod = 30) {
  return useQuery<DealPipelineSnapshot[]>({
    queryKey: [...DEAL_PIPELINE_TREND_QUERY_KEY, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_pipeline_snapshots')
        .select(DEAL_PIPELINE_TREND_COLUMNS)
        .gte('snapshot_date', pipelineTrendStartDate(days))
        .order('snapshot_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DealPipelineSnapshot[];
    },
    staleTime: 5 * 60 * 1000,
  });
}