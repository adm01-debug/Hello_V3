import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AgentHoldMetrics {
  agentName: string;
  totalHoldTime: number;
  holdCount: number;
  avgHoldTime: number;
  totalCalls: number;
  holdPercentage: number;
}

export interface DailyMetrics {
  date: string;
  totalHoldTime: number;
  holdCount: number;
  avgHoldTime: number;
}

export function useHoldMetrics(dateRange: '7d' | '30d' | '90d') {
  const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysBack));
  const endDate = endOfDay(new Date());

  const { data: holdEvents, isLoading: loadingHoldEvents } = useQuery({
    queryKey: ['holdEvents', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.from('hold_events').select('*')
        .gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: callSessions, isLoading: loadingCallSessions } = useQuery({
    queryKey: ['callSessionsWithHold', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.from('call_sessions').select('*')
        .gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agents').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const agentMetrics: AgentHoldMetrics[] = agents?.map(agent => {
    const agentSessions = callSessions?.filter(s => s.agent_name === agent.name) || [];
    const agentHoldEvents = holdEvents?.filter(h => h.agent_name === agent.name) || [];
    const totalHoldTime = agentHoldEvents.reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
    const holdCount = agentHoldEvents.length;
    const avgHoldTime = holdCount > 0 ? Math.round(totalHoldTime / holdCount) : 0;
    const totalCalls = agentSessions.length;
    const callsWithHold = new Set(agentHoldEvents.map(h => h.call_session_id)).size;
    const holdPercentage = totalCalls > 0 ? Math.round((callsWithHold / totalCalls) * 100) : 0;
    return { agentName: agent.name, totalHoldTime, holdCount, avgHoldTime, totalCalls, holdPercentage };
  }) || [];

  const dailyMetrics: DailyMetrics[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayEvents = holdEvents?.filter(h => {
      const d = new Date(h.created_at);
      return d >= dayStart && d <= dayEnd;
    }) || [];
    const totalHoldTime = dayEvents.reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
    const holdCount = dayEvents.length;
    const avgHoldTime = holdCount > 0 ? Math.round(totalHoldTime / holdCount) : 0;
    dailyMetrics.push({ date: format(day, 'dd/MM', { locale: ptBR }), totalHoldTime, holdCount, avgHoldTime });
  }

  const totalHoldTimeOverall = holdEvents?.reduce((sum, h) => sum + (h.duration_seconds || 0), 0) || 0;
  const totalHoldCountOverall = holdEvents?.length || 0;
  const avgHoldTimeOverall = totalHoldCountOverall > 0 ? Math.round(totalHoldTimeOverall / totalHoldCountOverall) : 0;
  const totalCallsOverall = callSessions?.length || 0;
  const callsWithHoldOverall = new Set(holdEvents?.map(h => h.call_session_id)).size;
  const holdRateOverall = totalCallsOverall > 0 ? Math.round((callsWithHoldOverall / totalCallsOverall) * 100) : 0;

  const sortedByAvg = [...agentMetrics].sort((a, b) => a.avgHoldTime - b.avgHoldTime);
  const bestPerformer = sortedByAvg.find(a => a.holdCount > 0);
  const worstPerformer = sortedByAvg.filter(a => a.holdCount > 0).pop();

  const pieData = agentMetrics.filter(a => a.totalHoldTime > 0).slice(0, 5).map(a => ({ name: a.agentName, value: a.totalHoldTime }));

  return {
    agentMetrics, dailyMetrics, pieData,
    totalHoldTimeOverall, totalHoldCountOverall, avgHoldTimeOverall,
    totalCallsOverall, holdRateOverall,
    bestPerformer, worstPerformer,
    isLoading: loadingHoldEvents || loadingCallSessions,
  };
}
