import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialImpactDay {
  day: string;
  total_calls: number;
  total_seconds: number;
  estimated_cost_cents: number;
  revenue_cents: number;
  deals_won: number;
  profit_cents: number;
}

export interface FinancialImpactSummary {
  total_cost_cents: number;
  total_revenue_cents: number;
  total_profit_cents: number;
  roi_percent: number;
  total_calls: number;
  total_deals_won: number;
  cac_cents: number;
}

export interface FinancialImpactDeltas {
  revenue_pct: number;
  cost_pct: number;
  profit_pct: number;
  roi_pct_points: number;
  calls_pct: number;
  deals_pct: number;
  cac_pct: number;
}

export interface FinancialImpactResult {
  series: FinancialImpactDay[];
  summary: FinancialImpactSummary;
  previous: FinancialImpactSummary;
  deltas: FinancialImpactDeltas;
}

export function summarize(series: FinancialImpactDay[]): FinancialImpactSummary {
  const total_cost_cents = series.reduce((s, d) => s + d.estimated_cost_cents, 0);
  const total_revenue_cents = series.reduce((s, d) => s + d.revenue_cents, 0);
  const total_profit_cents = total_revenue_cents - total_cost_cents;
  const total_calls = series.reduce((s, d) => s + d.total_calls, 0);
  const total_deals_won = series.reduce((s, d) => s + d.deals_won, 0);
  const roi_percent =
    total_cost_cents > 0 ? Number(((total_profit_cents / total_cost_cents) * 100).toFixed(1)) : 0;
  const cac_cents = total_deals_won > 0 ? Math.round(total_cost_cents / total_deals_won) : 0;
  return {
    total_cost_cents,
    total_revenue_cents,
    total_profit_cents,
    roi_percent,
    total_calls,
    total_deals_won,
    cac_cents,
  };
}

export function pct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

export function useFinancialImpact(days: number = 30) {
  return useQuery<FinancialImpactResult>({
    queryKey: ['financial-impact', days],
    queryFn: async () => {
      const dayMs = 24 * 3600 * 1000;
      const now = Date.now();
      const currentStart = new Date(now - days * dayMs).toISOString().slice(0, 10);
      const previousStart = new Date(now - 2 * days * dayMs).toISOString().slice(0, 10);
      const previousEnd = currentStart;

      const [currentRes, previousRes] = await Promise.all([
        supabase
          .from('financial_impact_daily')
          .select('*')
          .gte('day', currentStart)
          .order('day', { ascending: true }),
        supabase
          .from('financial_impact_daily')
          .select('*')
          .gte('day', previousStart)
          .lt('day', previousEnd)
          .order('day', { ascending: true }),
      ]);

      if (currentRes.error) throw currentRes.error;
      if (previousRes.error) throw previousRes.error;

      const series = (currentRes.data ?? []) as FinancialImpactDay[];
      const previousSeries = (previousRes.data ?? []) as FinancialImpactDay[];
      const summary = summarize(series);
      const previous = summarize(previousSeries);

      const deltas: FinancialImpactDeltas = {
        revenue_pct: pct(summary.total_revenue_cents, previous.total_revenue_cents),
        cost_pct: pct(summary.total_cost_cents, previous.total_cost_cents),
        profit_pct: pct(summary.total_profit_cents, previous.total_profit_cents),
        roi_pct_points: Number((summary.roi_percent - previous.roi_percent).toFixed(1)),
        calls_pct: pct(summary.total_calls, previous.total_calls),
        deals_pct: pct(summary.total_deals_won, previous.total_deals_won),
        cac_pct: pct(summary.cac_cents, previous.cac_cents),
      };

      return { series, summary, previous, deltas };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function financialImpactToCSV(series: FinancialImpactDay[]): string {
  const headers = [
    'day',
    'total_calls',
    'total_seconds',
    'estimated_cost_cents',
    'revenue_cents',
    'deals_won',
    'profit_cents',
  ];
  const rows = series.map((d) =>
    [d.day, d.total_calls, d.total_seconds, d.estimated_cost_cents, d.revenue_cents, d.deals_won, d.profit_cents].join(
      ',',
    ),
  );
  return [headers.join(','), ...rows].join('\r\n');
}
