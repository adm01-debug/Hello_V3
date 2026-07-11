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

export function useFinancialImpact(days: number = 30) {
  return useQuery<{ series: FinancialImpactDay[]; summary: FinancialImpactSummary }>({
    queryKey: ['financial-impact', days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('financial_impact_daily')
        .select('*')
        .gte('day', since)
        .order('day', { ascending: true });

      if (error) throw error;
      const series = (data ?? []) as FinancialImpactDay[];

      const total_cost_cents = series.reduce((s, d) => s + d.estimated_cost_cents, 0);
      const total_revenue_cents = series.reduce((s, d) => s + d.revenue_cents, 0);
      const total_profit_cents = total_revenue_cents - total_cost_cents;
      const total_calls = series.reduce((s, d) => s + d.total_calls, 0);
      const total_deals_won = series.reduce((s, d) => s + d.deals_won, 0);
      const roi_percent = total_cost_cents > 0 ? Number(((total_profit_cents / total_cost_cents) * 100).toFixed(1)) : 0;
      const cac_cents = total_deals_won > 0 ? Math.round(total_cost_cents / total_deals_won) : 0;

      return { series, summary: { total_cost_cents, total_revenue_cents, total_profit_cents, roi_percent, total_calls, total_deals_won, cac_cents } };
    },
    staleTime: 5 * 60 * 1000,
  });
}
