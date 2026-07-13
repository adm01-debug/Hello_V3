import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentLeaderboardRow {
  agent_name: string;
  total_calls: number;
  total_seconds: number;
  estimated_cost_cents: number;
  revenue_cents: number;
  deals_won: number;
  profit_cents: number;
  cac_cents: number;
  roi_percent: number;
}

export function useAgentFinancialLeaderboard(days: number = 30) {
  return useQuery<AgentLeaderboardRow[]>({
    queryKey: ['agent-financial-leaderboard', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_agent_financial_leaderboard', { p_days: days });
      if (error) throw error;
      return (data ?? []) as AgentLeaderboardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function agentLeaderboardToCSV(rows: AgentLeaderboardRow[]): string {
  const headers = [
    'agent_name',
    'total_calls',
    'total_seconds',
    'estimated_cost_cents',
    'revenue_cents',
    'deals_won',
    'profit_cents',
    'cac_cents',
    'roi_percent',
  ];
  const lines = rows.map((r) =>
    [
      JSON.stringify(r.agent_name ?? ''),
      r.total_calls,
      r.total_seconds,
      r.estimated_cost_cents,
      r.revenue_cents,
      r.deals_won,
      r.profit_cents,
      r.cac_cents,
      r.roi_percent,
    ].join(','),
  );
  return [headers.join(','), ...lines].join('\r\n');
}
