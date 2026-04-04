import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, eachDayOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ──────────────────────────────────────────────────────────────
export interface DashboardMetrics {
  totalCalls: number;
  totalAgents: number;
  avgSatisfaction: number;
  avgPerformance: number;
  avgDuration: number;
  completionRate: number;
  alertsCount: number;
  criticalAlerts: number;
  callsTrend: number;
  satisfactionTrend: number;
  totalHoldTime: number;
  avgHoldTime: number;
  holdCount: number;
  holdRate: number;
  holdAlerts: number;
}

export interface CallsByDay {
  date: string;
  calls: number;
  completed: number;
}

export interface SatisfactionTrend {
  date: string;
  satisfaction: number;
  performance: number;
}

export interface SentimentData {
  name: string;
  value: number;
}

export interface TopAgent {
  name: string;
  calls: number;
  satisfaction: number;
  performance: number;
}

export interface GoalsComparison {
  name: string;
  callsTarget: number;
  callsActual: number;
  satisfactionTarget: number;
  satisfactionActual: number;
  performanceTarget: number;
  performanceActual: number;
}

export interface HoldByAgent {
  name: string;
  holdTime: number;
  holdCount: number;
  avgHoldTime: number;
}

export type PeriodType = 'today' | 'week' | 'month' | 'all';

const EMPTY_METRICS: DashboardMetrics = {
  totalCalls: 0, totalAgents: 0, avgSatisfaction: 0, avgPerformance: 0,
  avgDuration: 0, completionRate: 0, alertsCount: 0, criticalAlerts: 0,
  callsTrend: 0, satisfactionTrend: 0, totalHoldTime: 0, avgHoldTime: 0,
  holdCount: 0, holdRate: 0, holdAlerts: 0,
};

function getDateFilter(period: PeriodType): Date {
  switch (period) {
    case 'today': { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    case 'week': return subDays(new Date(), 7);
    case 'month': return subDays(new Date(), 30);
    case 'all': return new Date(0);
    default: return subDays(new Date(), 7);
  }
}

export function getPeriodLabel(period: PeriodType): string {
  const labels: Record<PeriodType, string> = {
    today: 'hoje', week: 'últimos 7 dias', month: 'últimos 30 dias', all: 'todo período',
  };
  return labels[period] ?? 'últimos 7 dias';
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function useExecutiveDashboardData(period: PeriodType) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [callsByDay, setCallsByDay] = useState<CallsByDay[]>([]);
  const [satisfactionTrend, setSatisfactionTrend] = useState<SatisfactionTrend[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [goalsComparison, setGoalsComparison] = useState<GoalsComparison[]>([]);
  const [holdByAgent, setHoldByAgent] = useState<HoldByAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAllMetrics = useCallback(async () => {
    setIsLoading(true);
    const dateFilter = getDateFilter(period);

    let sessionsQuery = supabase.from('call_sessions').select('*');
    if (period !== 'all') sessionsQuery = sessionsQuery.gte('created_at', dateFilter.toISOString());
    const { data: sessions } = await sessionsQuery;

    const { data: summaries } = await supabase.from('call_summaries').select('*');
    const { data: alerts } = await supabase.from('call_alerts').select('*').eq('is_read', false);
    const { data: agentGoals } = await supabase.from('agent_goals').select('*');

    let holdQuery = supabase.from('hold_events').select('*');
    if (period !== 'all') holdQuery = holdQuery.gte('created_at', dateFilter.toISOString());
    const { data: holdEvents } = await holdQuery;

    if (!sessions) { setIsLoading(false); return; }

    const sessionIds = new Set(sessions.map(s => s.id));
    const filteredSummaries = summaries?.filter(s => sessionIds.has(s.call_session_id)) ?? [];

    // Basic metrics
    const totalCalls = sessions.length;
    const uniqueAgents = new Set(sessions.map(s => s.agent_name).filter(Boolean));
    const completedCalls = sessions.filter(s => s.status === 'completed').length;
    const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const avgDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / (totalCalls || 1);

    const validSummaries = filteredSummaries.filter(s => s.customer_satisfaction && s.agent_performance_score);
    const avgSatisfaction = validSummaries.reduce((s, x) => s + (x.customer_satisfaction ?? 0), 0) / (validSummaries.length || 1);
    const avgPerformance = validSummaries.reduce((s, x) => s + (x.agent_performance_score ?? 0), 0) / (validSummaries.length || 1);

    const alertsCount = alerts?.length ?? 0;
    const criticalAlerts = alerts?.filter(a => a.severity === 'critical').length ?? 0;

    const now = new Date();
    const last7 = sessions.filter(s => new Date(s.created_at) >= subDays(now, 7)).length;
    const prev7 = sessions.filter(s => new Date(s.created_at) >= subDays(now, 14) && new Date(s.created_at) < subDays(now, 7)).length;
    const callsTrend = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0;

    // Hold metrics
    const totalHoldTime = holdEvents?.reduce((s, h) => s + (h.duration_seconds ?? 0), 0) ?? 0;
    const holdCount = holdEvents?.length ?? 0;
    const avgHoldTime = holdCount > 0 ? totalHoldTime / holdCount : 0;
    const callsWithHold = new Set(holdEvents?.map(h => h.call_session_id).filter(Boolean)).size;
    const holdRate = totalCalls > 0 ? (callsWithHold / totalCalls) * 100 : 0;
    const holdAlerts = alerts?.filter(a => a.alert_type?.includes('hold') || a.title?.toLowerCase().includes('espera') || a.title?.toLowerCase().includes('hold')).length ?? 0;

    // Hold by agent
    const holdMap = new Map<string, { holdTime: number; holdCount: number }>();
    holdEvents?.forEach(h => {
      if (!h.agent_name) return;
      const c = holdMap.get(h.agent_name) ?? { holdTime: 0, holdCount: 0 };
      c.holdTime += h.duration_seconds ?? 0;
      c.holdCount += 1;
      holdMap.set(h.agent_name, c);
    });
    setHoldByAgent(
      Array.from(holdMap.entries())
        .map(([name, s]) => ({ name, holdTime: s.holdTime, holdCount: s.holdCount, avgHoldTime: s.holdCount > 0 ? s.holdTime / s.holdCount : 0 }))
        .sort((a, b) => b.holdTime - a.holdTime)
        .slice(0, 5)
    );

    setMetrics({
      totalCalls, totalAgents: uniqueAgents.size, avgSatisfaction, avgPerformance, avgDuration,
      completionRate, alertsCount, criticalAlerts, callsTrend, satisfactionTrend: 0,
      totalHoldTime, avgHoldTime, holdCount, holdRate, holdAlerts,
    });

    // Calls by day
    const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
    setCallsByDay(days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayCalls = sessions.filter(s => format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr);
      return { date: format(day, 'dd/MM', { locale: ptBR }), calls: dayCalls.length, completed: dayCalls.filter(s => s.status === 'completed').length };
    }));

    // Satisfaction trend
    setSatisfactionTrend(days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessions.filter(s => format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr);
      const dayIds = new Set(daySessions.map(s => s.id));
      const ds = summaries?.filter(s => dayIds.has(s.call_session_id) && (s.customer_satisfaction || s.agent_performance_score)) ?? [];
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        satisfaction: ds.length > 0 ? Number((ds.reduce((s, x) => s + (x.customer_satisfaction ?? 0), 0) / ds.length).toFixed(1)) : 0,
        performance: ds.length > 0 ? Number((ds.reduce((s, x) => s + (x.agent_performance_score ?? 0), 0) / ds.length).toFixed(1)) : 0,
      };
    }));

    // Sentiment
    const sc: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
    summaries?.forEach(s => { if (s.overall_sentiment && sc[s.overall_sentiment] !== undefined) sc[s.overall_sentiment]++; });
    setSentimentData([{ name: 'Positivo', value: sc.positive }, { name: 'Neutro', value: sc.neutral }, { name: 'Negativo', value: sc.negative }]);

    // Top agents
    const agentStats = new Map<string, { calls: number; satisfaction: number[]; performance: number[] }>();
    sessions.forEach(s => { if (!s.agent_name) return; const c = agentStats.get(s.agent_name) ?? { calls: 0, satisfaction: [], performance: [] }; c.calls++; agentStats.set(s.agent_name, c); });
    const sessionAgent = new Map(sessions.map(s => [s.id, s.agent_name]));
    summaries?.forEach(su => {
      const an = sessionAgent.get(su.call_session_id);
      if (!an) return;
      const c = agentStats.get(an);
      if (!c) return;
      if (su.customer_satisfaction) c.satisfaction.push(su.customer_satisfaction);
      if (su.agent_performance_score) c.performance.push(su.agent_performance_score);
    });

    const allAgentData = Array.from(agentStats.entries()).map(([name, s]) => ({
      name, calls: s.calls,
      satisfaction: s.satisfaction.length > 0 ? s.satisfaction.reduce((a, b) => a + b, 0) / s.satisfaction.length : 0,
      performance: s.performance.length > 0 ? s.performance.reduce((a, b) => a + b, 0) / s.performance.length : 0,
    }));
    setTopAgents(allAgentData.sort((a, b) => b.calls - a.calls).slice(0, 5));

    // Goals comparison
    if (agentGoals?.length) {
      setGoalsComparison(agentGoals.map(g => {
        const ad = allAgentData.find(a => a.name === g.agent_name);
        return {
          name: g.agent_name,
          callsTarget: g.calls_target, callsActual: ad?.calls ?? 0,
          satisfactionTarget: Number(g.satisfaction_target), satisfactionActual: Number(ad?.satisfaction?.toFixed(1) ?? 0),
          performanceTarget: Number(g.performance_target), performanceActual: Number(ad?.performance?.toFixed(1) ?? 0),
        };
      }));
    }

    setIsLoading(false);
    setLastUpdate(new Date());
  }, [period]);

  useEffect(() => { fetchAllMetrics(); }, [fetchAllMetrics]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('executive-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => fetchAllMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_summaries' }, () => fetchAllMetrics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_alerts' }, () => fetchAllMetrics())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAllMetrics]);

  return {
    metrics, callsByDay, satisfactionTrend, sentimentData,
    topAgents, goalsComparison, holdByAgent, isLoading, lastUpdate,
  };
}
