import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';

export interface AgentStats {
  name: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  avgPerformance: number;
  completedCalls: number;
  score: number;
}

export interface AgentGoals {
  agent_name: string;
  calls_target: number;
  satisfaction_target: number;
  performance_target: number;
}

export interface PerformanceDataPoint {
  date: string;
  [agentName: string]: string | number;
}

export const DEFAULT_GOALS = {
  calls_target: 50,
  satisfaction_target: 8,
  performance_target: 8,
};

export const AGENT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

export function useAgentRanking() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [agentGoals, setAgentGoals] = useState<Map<string, AgentGoals>>(new Map());
  const [notifiedAgents, setNotifiedAgents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('score');
  const [period, setPeriod] = useState<string>('all');
  const [editingGoals, setEditingGoals] = useState<AgentGoals | null>(null);
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAgentStats();
    fetchPerformanceHistory();
    fetchAgentGoals();
  }, [period]);

  useEffect(() => {
    if (agents.length > 0 && agentGoals.size >= 0) {
      checkGoalAchievements();
    }
  }, [agents, agentGoals]);

  useEffect(() => {
    const sorted = [...agents].sort((a, b) => {
      switch (sortBy) {
        case 'calls': return b.totalCalls - a.totalCalls;
        case 'satisfaction': return b.avgSatisfaction - a.avgSatisfaction;
        case 'performance': return b.avgPerformance - a.avgPerformance;
        default: return b.score - a.score;
      }
    });
    setAgents(sorted);
  }, [sortBy]);

  const getGoalsForAgent = (agentName: string): AgentGoals => {
    return agentGoals.get(agentName) || { agent_name: agentName, ...DEFAULT_GOALS };
  };

  const checkGoalAchievements = async () => {
    for (const agent of agents) {
      const goals = getGoalsForAgent(agent.name);
      const allAchieved =
        agent.totalCalls >= goals.calls_target &&
        agent.avgSatisfaction >= goals.satisfaction_target &&
        agent.avgPerformance >= goals.performance_target;

      if (allAchieved && !notifiedAgents.has(agent.name)) {
        setNotifiedAgents((prev) => new Set(prev).add(agent.name));
        toast.success(`🎉 ${agent.name} atingiu todas as metas!`, {
          description: `Chamadas: ${agent.totalCalls}/${goals.calls_target}, Satisfação: ${agent.avgSatisfaction.toFixed(1)}/10`,
          duration: 6000,
          className: "bg-success/10 border-success/20",
        });

        const { data: session } = await supabase
          .from('call_sessions').select('id').eq('agent_name', agent.name).limit(1).maybeSingle();

        if (session) {
          await supabase.from('call_alerts').insert({
            call_session_id: session.id,
            alert_type: 'goals_achieved',
            severity: 'info',
            title: `${agent.name} atingiu todas as metas!`,
            message: `Parabéns! O agente ${agent.name} completou todas as metas: ${agent.totalCalls} chamadas, ${agent.avgSatisfaction.toFixed(1)} satisfação, ${agent.avgPerformance.toFixed(1)} performance.`,
          });
        }
      }
    }
  };

  const fetchAgentGoals = async () => {
    const { data, error } = await supabase.from('agent_goals').select('*');
    if (error) { logger.error('Error fetching goals:', error); return; }
    const goalsMap = new Map<string, AgentGoals>();
    data?.forEach((g) => goalsMap.set(g.agent_name, g as AgentGoals));
    setAgentGoals(goalsMap);
  };

  const saveGoals = async () => {
    if (!editingGoals) return;
    const { error } = await supabase.from('agent_goals').upsert({
      agent_name: editingGoals.agent_name,
      calls_target: editingGoals.calls_target,
      satisfaction_target: editingGoals.satisfaction_target,
      performance_target: editingGoals.performance_target,
    }, { onConflict: 'agent_name' });

    if (error) { toast.error('Erro ao salvar metas'); logger.error('Error saving goals:', error); return; }
    toast.success('Metas salvas com sucesso!');
    fetchAgentGoals();
    setGoalsDialogOpen(false);
    setEditingGoals(null);
  };

  const fetchAgentStats = async () => {
    setIsLoading(true);
    let sessionsQuery = supabase.from('call_sessions').select('agent_name, duration_seconds, status');

    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'today': startDate = new Date(now.setHours(0, 0, 0, 0)); break;
        case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
        case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
        default: startDate = new Date(0);
      }
      sessionsQuery = sessionsQuery.gte('created_at', startDate.toISOString());
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;
    if (sessionsError) { logger.error('Error fetching sessions:', sessionsError); toast.error('Erro ao carregar dados dos agentes'); setIsLoading(false); return; }

    const { data: summaries } = await supabase.from('call_summaries').select('call_session_id, customer_satisfaction, agent_performance_score');
    const { data: sessionIds } = await supabase.from('call_sessions').select('id, agent_name');
    const sessionAgentMap = new Map(sessionIds?.map(s => [s.id, s.agent_name]) || []);

    const agentMap = new Map<string, { totalCalls: number; totalDuration: number; completedCalls: number; satisfactionSum: number; satisfactionCount: number; performanceSum: number; performanceCount: number }>();

    sessions?.forEach((session) => {
      if (!session.agent_name) return;
      const current = agentMap.get(session.agent_name) || { totalCalls: 0, totalDuration: 0, completedCalls: 0, satisfactionSum: 0, satisfactionCount: 0, performanceSum: 0, performanceCount: 0 };
      current.totalCalls++;
      current.totalDuration += session.duration_seconds || 0;
      if (session.status === 'completed') current.completedCalls++;
      agentMap.set(session.agent_name, current);
    });

    summaries?.forEach((summary) => {
      const agentName = sessionAgentMap.get(summary.call_session_id);
      if (!agentName) return;
      const current = agentMap.get(agentName);
      if (!current) return;
      if (summary.customer_satisfaction) { current.satisfactionSum += summary.customer_satisfaction; current.satisfactionCount++; }
      if (summary.agent_performance_score) { current.performanceSum += summary.agent_performance_score; current.performanceCount++; }
      agentMap.set(agentName, current);
    });

    const agentStats: AgentStats[] = Array.from(agentMap.entries()).map(([name, stats]) => {
      const avgDuration = stats.totalCalls > 0 ? stats.totalDuration / stats.totalCalls : 0;
      const avgSatisfaction = stats.satisfactionCount > 0 ? stats.satisfactionSum / stats.satisfactionCount : 0;
      const avgPerformance = stats.performanceCount > 0 ? stats.performanceSum / stats.performanceCount : 0;
      const completionRate = stats.totalCalls > 0 ? (stats.completedCalls / stats.totalCalls) * 100 : 0;
      const score = (avgSatisfaction * 4) + (avgPerformance * 4) + (completionRate * 0.2);
      return { name, totalCalls: stats.totalCalls, avgDuration, avgSatisfaction, avgPerformance, completedCalls: stats.completedCalls, score };
    });

    agentStats.sort((a, b) => {
      switch (sortBy) {
        case 'calls': return b.totalCalls - a.totalCalls;
        case 'satisfaction': return b.avgSatisfaction - a.avgSatisfaction;
        case 'performance': return b.avgPerformance - a.avgPerformance;
        default: return b.score - a.score;
      }
    });

    setAgents(agentStats);
    setIsLoading(false);
  };

  const fetchPerformanceHistory = async () => {
    const endDate = new Date();
    const startDate = subDays(endDate, 6);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const { data: sessions, error: sessionsError } = await supabase
      .from('call_sessions').select('id, agent_name, created_at')
      .gte('created_at', startDate.toISOString()).order('created_at', { ascending: true });

    if (sessionsError) { logger.error('Error fetching performance history:', sessionsError); return; }

    const { data: summaries, error: summariesError } = await supabase
      .from('call_summaries').select('call_session_id, agent_performance_score');

    if (summariesError) { logger.error('Error fetching summaries:', summariesError); return; }

    const sessionPerformanceMap = new Map<string, number>();
    summaries?.forEach((s) => { if (s.agent_performance_score) sessionPerformanceMap.set(s.call_session_id, s.agent_performance_score); });

    const agentDailyPerformance = new Map<string, Map<string, number[]>>();
    const agentNames = new Set<string>();

    sessions?.forEach((session) => {
      if (!session.agent_name) return;
      agentNames.add(session.agent_name);
      const dayKey = format(new Date(session.created_at), 'yyyy-MM-dd');
      const performance = sessionPerformanceMap.get(session.id);
      if (performance) {
        if (!agentDailyPerformance.has(dayKey)) agentDailyPerformance.set(dayKey, new Map());
        const dayMap = agentDailyPerformance.get(dayKey)!;
        if (!dayMap.has(session.agent_name)) dayMap.set(session.agent_name, []);
        dayMap.get(session.agent_name)!.push(performance);
      }
    });

    const chartData: PerformanceDataPoint[] = days.map((day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayLabel = format(day, 'dd/MM', { locale: ptBR });
      const point: PerformanceDataPoint = { date: dayLabel };
      agentNames.forEach((agentName) => {
        const performances = agentDailyPerformance.get(dayKey)?.get(agentName) || [];
        const avg = performances.length > 0 ? performances.reduce((a, b) => a + b, 0) / performances.length : 0;
        point[agentName] = Number(avg.toFixed(1));
      });
      return point;
    });

    setPerformanceData(chartData);
  };

  const createTestData = async () => {
    const agentNames = ['Lucas Ferreira', 'Ana Carolina Silva', 'Pedro Santos', 'Mariana Costa', 'João Oliveira', 'Beatriz Almeida'];
    const sentiments = ['positive', 'neutral', 'negative'];
    const topics = ['Suporte Técnico', 'Cobrança', 'Vendas', 'Cancelamento', 'Dúvidas', 'Reclamação'];

    try {
      for (const agentName of agentNames) {
        const numCalls = Math.floor(Math.random() * 10) + 5;
        for (let i = 0; i < numCalls; i++) {
          const durationSeconds = Math.floor(Math.random() * 600) + 120;
          const status = Math.random() > 0.1 ? 'completed' : 'missed';
          const { data: session, error: sessionError } = await supabase
            .from('call_sessions').insert({
              agent_name: agentName, caller_name: `Cliente ${Math.floor(Math.random() * 1000)}`,
              caller_phone: `+55 11 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
              status, duration_seconds: status === 'completed' ? durationSeconds : 0,
              started_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              ended_at: status === 'completed' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + durationSeconds * 1000).toISOString() : null,
            }).select('id').single();

          if (sessionError) { logger.error('Error creating session:', sessionError); continue; }
          if (session && status === 'completed') {
            const satisfaction = Math.floor(Math.random() * 5) + 5;
            const performance = Math.floor(Math.random() * 4) + 6;
            await supabase.from('call_summaries').insert({
              call_session_id: session.id, summary: `Atendimento realizado por ${agentName}. Cliente atendido com sucesso.`,
              overall_sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
              customer_satisfaction: satisfaction, agent_performance_score: performance,
              main_topics: [topics[Math.floor(Math.random() * topics.length)]], next_steps: ['Acompanhar caso', 'Enviar documentação'],
            });
            await supabase.from('call_analyses').insert({
              call_session_id: session.id, sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
              emotion: ['satisfied', 'neutral', 'frustrated'][Math.floor(Math.random() * 3)],
              urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              suggestion: 'Manter padrão de atendimento', message_analyzed: 'Análise da chamada completa',
            });
          }
        }
      }
      toast.success('Dados de teste criados com sucesso!');
      fetchAgentStats();
    } catch (error) {
      logger.error('Error creating test data:', error);
      toast.error('Erro ao criar dados de teste');
    }
  };

  return {
    agents, performanceData, isLoading, sortBy, setSortBy, period, setPeriod,
    editingGoals, setEditingGoals, goalsDialogOpen, setGoalsDialogOpen,
    getGoalsForAgent, saveGoals, createTestData,
  };
}
