import { useState, useEffect } from 'react';
import { Trophy, Medal, Phone, Star, Users, FlaskConical, TrendingUp, Target, CheckCircle2, XCircle, Settings2, Award, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BadgesShowcase } from '@/components/gamification/BadgesShowcase';
import { useGamification } from '@/hooks/useGamification';
import { useAgentStatus } from '@/hooks/useAgentStatus';

interface AgentStats {
  name: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  avgPerformance: number;
  completedCalls: number;
  score: number;
}

interface AgentGoals {
  agent_name: string;
  calls_target: number;
  satisfaction_target: number;
  performance_target: number;
}

const DEFAULT_GOALS = {
  calls_target: 50,
  satisfaction_target: 8,
  performance_target: 8,
};

interface PerformanceDataPoint {
  date: string;
  [agentName: string]: string | number;
}

const AGENT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

export default function AgentRanking() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [agentGoals, setAgentGoals] = useState<Map<string, AgentGoals>>(new Map());
  const [notifiedAgents, setNotifiedAgents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('score');
  const [period, setPeriod] = useState<string>('all');
  const [editingGoals, setEditingGoals] = useState<AgentGoals | null>(null);
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ranking');
  
  const { agents: agentsList, currentAgent } = useAgentStatus();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const { badges, agentBadges, isLoading: badgesLoading } = useGamification(selectedAgentId);

  useEffect(() => {
    if (currentAgent?.id && !selectedAgentId) {
      setSelectedAgentId(currentAgent.id);
    }
  }, [currentAgent]);

  useEffect(() => {
    fetchAgentStats();
    fetchPerformanceHistory();
    fetchAgentGoals();
  }, [period]);

  // Check for goal achievements when agents or goals change
  useEffect(() => {
    if (agents.length > 0 && agentGoals.size >= 0) {
      checkGoalAchievements();
    }
  }, [agents, agentGoals]);

  const checkGoalAchievements = async () => {
    for (const agent of agents) {
      const goals = getGoalsForAgent(agent.name);
      const callsAchieved = agent.totalCalls >= goals.calls_target;
      const satisfactionAchieved = agent.avgSatisfaction >= goals.satisfaction_target;
      const performanceAchieved = agent.avgPerformance >= goals.performance_target;
      const allAchieved = callsAchieved && satisfactionAchieved && performanceAchieved;

      if (allAchieved && !notifiedAgents.has(agent.name)) {
        // Mark as notified to avoid duplicate notifications
        setNotifiedAgents((prev) => new Set(prev).add(agent.name));

        // Show toast notification
        toast.success(`🎉 ${agent.name} atingiu todas as metas!`, {
          description: `Chamadas: ${agent.totalCalls}, Satisfação: ${agent.avgSatisfaction.toFixed(1)}, Performance: ${agent.avgPerformance.toFixed(1)}`,
          duration: 6000,
        });

        // Create alert in database
        const { data: session } = await supabase
          .from('call_sessions')
          .select('id')
          .eq('agent_name', agent.name)
          .limit(1)
          .maybeSingle();

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
    const { data, error } = await supabase
      .from('agent_goals')
      .select('*');

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    const goalsMap = new Map<string, AgentGoals>();
    data?.forEach((g) => {
      goalsMap.set(g.agent_name, g as AgentGoals);
    });
    setAgentGoals(goalsMap);
  };

  const getGoalsForAgent = (agentName: string) => {
    return agentGoals.get(agentName) || {
      agent_name: agentName,
      ...DEFAULT_GOALS,
    };
  };

  const saveGoals = async () => {
    if (!editingGoals) return;

    const { error } = await supabase
      .from('agent_goals')
      .upsert({
        agent_name: editingGoals.agent_name,
        calls_target: editingGoals.calls_target,
        satisfaction_target: editingGoals.satisfaction_target,
        performance_target: editingGoals.performance_target,
      }, { onConflict: 'agent_name' });

    if (error) {
      toast.error('Erro ao salvar metas');
      console.error('Error saving goals:', error);
      return;
    }

    toast.success('Metas salvas com sucesso!');
    fetchAgentGoals();
    setGoalsDialogOpen(false);
    setEditingGoals(null);
  };

  const fetchAgentStats = async () => {
    setIsLoading(true);

    let sessionsQuery = supabase
      .from('call_sessions')
      .select('agent_name, duration_seconds, status');

    // Apply period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      
      sessionsQuery = sessionsQuery.gte('created_at', startDate.toISOString());
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      toast.error('Erro ao carregar dados dos agentes');
      setIsLoading(false);
      return;
    }

    const { data: summaries, error: summariesError } = await supabase
      .from('call_summaries')
      .select('call_session_id, customer_satisfaction, agent_performance_score');

    if (summariesError) {
      console.error('Error fetching summaries:', summariesError);
    }

    // Get session IDs for mapping summaries
    const { data: sessionIds } = await supabase
      .from('call_sessions')
      .select('id, agent_name');

    const sessionAgentMap = new Map(sessionIds?.map(s => [s.id, s.agent_name]) || []);

    // Aggregate stats by agent
    const agentMap = new Map<string, {
      totalCalls: number;
      totalDuration: number;
      completedCalls: number;
      satisfactionSum: number;
      satisfactionCount: number;
      performanceSum: number;
      performanceCount: number;
    }>();

    sessions?.forEach((session) => {
      if (!session.agent_name) return;
      
      const current = agentMap.get(session.agent_name) || {
        totalCalls: 0,
        totalDuration: 0,
        completedCalls: 0,
        satisfactionSum: 0,
        satisfactionCount: 0,
        performanceSum: 0,
        performanceCount: 0,
      };

      current.totalCalls++;
      current.totalDuration += session.duration_seconds || 0;
      if (session.status === 'completed') {
        current.completedCalls++;
      }

      agentMap.set(session.agent_name, current);
    });

    // Add summary data
    summaries?.forEach((summary) => {
      const agentName = sessionAgentMap.get(summary.call_session_id);
      if (!agentName) return;

      const current = agentMap.get(agentName);
      if (!current) return;

      if (summary.customer_satisfaction) {
        current.satisfactionSum += summary.customer_satisfaction;
        current.satisfactionCount++;
      }
      if (summary.agent_performance_score) {
        current.performanceSum += summary.agent_performance_score;
        current.performanceCount++;
      }

      agentMap.set(agentName, current);
    });

    // Calculate final stats
    const agentStats: AgentStats[] = Array.from(agentMap.entries()).map(([name, stats]) => {
      const avgDuration = stats.totalCalls > 0 ? stats.totalDuration / stats.totalCalls : 0;
      const avgSatisfaction = stats.satisfactionCount > 0 
        ? stats.satisfactionSum / stats.satisfactionCount 
        : 0;
      const avgPerformance = stats.performanceCount > 0 
        ? stats.performanceSum / stats.performanceCount 
        : 0;
      
      // Calculate composite score (weighted average)
      const completionRate = stats.totalCalls > 0 ? (stats.completedCalls / stats.totalCalls) * 100 : 0;
      const score = (avgSatisfaction * 4) + (avgPerformance * 4) + (completionRate * 0.2);

      return {
        name,
        totalCalls: stats.totalCalls,
        avgDuration,
        avgSatisfaction,
        avgPerformance,
        completedCalls: stats.completedCalls,
        score,
      };
    });

    // Sort agents
    agentStats.sort((a, b) => {
      switch (sortBy) {
        case 'calls':
          return b.totalCalls - a.totalCalls;
        case 'satisfaction':
          return b.avgSatisfaction - a.avgSatisfaction;
        case 'performance':
          return b.avgPerformance - a.avgPerformance;
        default:
          return b.score - a.score;
      }
    });

    setAgents(agentStats);
    setIsLoading(false);
  };

  const fetchPerformanceHistory = async () => {
    // Get last 7 days
    const endDate = new Date();
    const startDate = subDays(endDate, 6);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const { data: sessions, error: sessionsError } = await supabase
      .from('call_sessions')
      .select('id, agent_name, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching performance history:', sessionsError);
      return;
    }

    const { data: summaries, error: summariesError } = await supabase
      .from('call_summaries')
      .select('call_session_id, agent_performance_score');

    if (summariesError) {
      console.error('Error fetching summaries:', summariesError);
      return;
    }

    // Create a map of session_id to performance score
    const sessionPerformanceMap = new Map<string, number>();
    summaries?.forEach((s) => {
      if (s.agent_performance_score) {
        sessionPerformanceMap.set(s.call_session_id, s.agent_performance_score);
      }
    });

    // Group sessions by day and agent
    const agentDailyPerformance = new Map<string, Map<string, number[]>>();
    const agentNames = new Set<string>();

    sessions?.forEach((session) => {
      if (!session.agent_name) return;
      
      agentNames.add(session.agent_name);
      const dayKey = format(new Date(session.created_at), 'yyyy-MM-dd');
      const performance = sessionPerformanceMap.get(session.id);

      if (performance) {
        if (!agentDailyPerformance.has(dayKey)) {
          agentDailyPerformance.set(dayKey, new Map());
        }
        const dayMap = agentDailyPerformance.get(dayKey)!;
        if (!dayMap.has(session.agent_name)) {
          dayMap.set(session.agent_name, []);
        }
        dayMap.get(session.agent_name)!.push(performance);
      }
    });

    // Build chart data
    const chartData: PerformanceDataPoint[] = days.map((day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayLabel = format(day, 'dd/MM', { locale: ptBR });
      const point: PerformanceDataPoint = { date: dayLabel };

      agentNames.forEach((agentName) => {
        const dayMap = agentDailyPerformance.get(dayKey);
        const performances = dayMap?.get(agentName) || [];
        const avg = performances.length > 0 
          ? performances.reduce((a, b) => a + b, 0) / performances.length 
          : 0;
        point[agentName] = Number(avg.toFixed(1));
      });

      return point;
    });

    setPerformanceData(chartData);
  };

  useEffect(() => {
    const sorted = [...agents].sort((a, b) => {
      switch (sortBy) {
        case 'calls':
          return b.totalCalls - a.totalCalls;
        case 'satisfaction':
          return b.avgSatisfaction - a.avgSatisfaction;
        case 'performance':
          return b.avgPerformance - a.avgPerformance;
        default:
          return b.score - a.score;
      }
    });
    setAgents(sorted);
  }, [sortBy]);

  const createTestData = async () => {
    const agentNames = [
      'Lucas Ferreira',
      'Ana Carolina Silva',
      'Pedro Santos',
      'Mariana Costa',
      'João Oliveira',
      'Beatriz Almeida',
    ];

    const sentiments = ['positive', 'neutral', 'negative'];
    const topics = ['Suporte Técnico', 'Cobrança', 'Vendas', 'Cancelamento', 'Dúvidas', 'Reclamação'];

    try {
      // Create sessions for each agent
      for (const agentName of agentNames) {
        const numCalls = Math.floor(Math.random() * 10) + 5; // 5-15 calls per agent

        for (let i = 0; i < numCalls; i++) {
          const durationSeconds = Math.floor(Math.random() * 600) + 120; // 2-12 minutes
          const status = Math.random() > 0.1 ? 'completed' : 'missed';

          // Create call session
          const { data: session, error: sessionError } = await supabase
            .from('call_sessions')
            .insert({
              agent_name: agentName,
              caller_name: `Cliente ${Math.floor(Math.random() * 1000)}`,
              caller_phone: `+55 11 9${Math.floor(Math.random() * 90000000 + 10000000)}`,
              status,
              duration_seconds: status === 'completed' ? durationSeconds : 0,
              started_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              ended_at: status === 'completed' 
                ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + durationSeconds * 1000).toISOString()
                : null,
            })
            .select('id')
            .single();

          if (sessionError) {
            console.error('Error creating session:', sessionError);
            continue;
          }

          if (session && status === 'completed') {
            // Create call summary
            const satisfaction = Math.floor(Math.random() * 5) + 5; // 5-10
            const performance = Math.floor(Math.random() * 4) + 6; // 6-10

            await supabase.from('call_summaries').insert({
              call_session_id: session.id,
              summary: `Atendimento realizado por ${agentName}. Cliente atendido com sucesso.`,
              overall_sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
              customer_satisfaction: satisfaction,
              agent_performance_score: performance,
              main_topics: [topics[Math.floor(Math.random() * topics.length)]],
              next_steps: ['Acompanhar caso', 'Enviar documentação'],
            });

            // Create call analysis
            await supabase.from('call_analyses').insert({
              call_session_id: session.id,
              sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
              emotion: ['satisfied', 'neutral', 'frustrated'][Math.floor(Math.random() * 3)],
              urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              suggestion: 'Manter padrão de atendimento',
              message_analyzed: 'Análise da chamada completa',
            });
          }
        }
      }

      toast.success('Dados de teste criados com sucesso!');
      fetchAgentStats();
    } catch (error) {
      console.error('Error creating test data:', error);
      toast.error('Erro ao criar dados de teste');
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const topAgents = agents.slice(0, 3);
  const totalCalls = agents.reduce((sum, a) => sum + a.totalCalls, 0);
  const avgTeamSatisfaction = agents.length > 0
    ? agents.reduce((sum, a) => sum + a.avgSatisfaction, 0) / agents.length
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gamificação & Ranking</h1>
            <p className="text-muted-foreground">
              Conquistas, badges e comparativo de desempenho
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={createTestData}>
            <FlaskConical className="h-4 w-4 mr-2" />
            Criar Dados de Teste
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Pontuação</SelectItem>
              <SelectItem value="calls">Total de Chamadas</SelectItem>
              <SelectItem value="satisfaction">Satisfação</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">Ativos no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTeamSatisfaction.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">Da equipe</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Agente</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {topAgents[0]?.name || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Pontuação: {topAgents[0]?.score.toFixed(1) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Evolution Chart */}
      {performanceData.length > 0 && agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução de Performance (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ 
                      value: 'Performance', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: 'hsl(var(--muted-foreground))'
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  <Legend />
                  {agents.slice(0, 8).map((agent, index) => (
                    <Line
                      key={agent.name}
                      type="monotone"
                      dataKey={agent.name}
                      stroke={AGENT_COLORS[index % AGENT_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      {topAgents.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Pódio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4 py-6">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-16 w-16 mb-2 border-4 border-muted-foreground/40">
                  <AvatarFallback className="text-lg bg-muted-foreground/20">
                    {getInitials(topAgents[1]?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <Medal className="h-8 w-8 text-muted-foreground mb-1" />
                <span className="font-semibold text-center">{topAgents[1]?.name}</span>
                <span className="text-sm text-muted-foreground">
                  {topAgents[1]?.score.toFixed(1)} pts
                </span>
                <div className="h-20 w-24 bg-muted-foreground/20 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">2º</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-2 border-4 border-yellow-500">
                  <AvatarFallback className="text-xl bg-yellow-500/20">
                    {getInitials(topAgents[0]?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <Trophy className="h-10 w-10 text-yellow-500 mb-1" />
                <span className="font-bold text-lg text-center">{topAgents[0]?.name}</span>
                <span className="text-sm text-muted-foreground">
                  {topAgents[0]?.score.toFixed(1)} pts
                </span>
                <div className="h-28 w-28 bg-yellow-500/20 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-3xl font-bold text-yellow-500">1º</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-14 w-14 mb-2 border-4 border-amber-600">
                  <AvatarFallback className="text-base bg-amber-600/20">
                    {getInitials(topAgents[2]?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <Medal className="h-7 w-7 text-amber-600 mb-1" />
                <span className="font-semibold text-center">{topAgents[2]?.name}</span>
                <span className="text-sm text-muted-foreground">
                  {topAgents[2]?.score.toFixed(1)} pts
                </span>
                <div className="h-14 w-20 bg-amber-600/20 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-xl font-bold text-amber-600">3º</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals vs Achieved */}
      {agents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Metas vs Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.slice(0, 6).map((agent) => {
                const goals = getGoalsForAgent(agent.name);
                const callsProgress = Math.min((agent.totalCalls / goals.calls_target) * 100, 100);
                const satisfactionProgress = Math.min((agent.avgSatisfaction / goals.satisfaction_target) * 100, 100);
                const performanceProgress = Math.min((agent.avgPerformance / goals.performance_target) * 100, 100);
                
                const callsAchieved = agent.totalCalls >= goals.calls_target;
                const satisfactionAchieved = agent.avgSatisfaction >= goals.satisfaction_target;
                const performanceAchieved = agent.avgPerformance >= goals.performance_target;
                const allAchieved = callsAchieved && satisfactionAchieved && performanceAchieved;

                return (
                  <div
                    key={agent.name}
                    className={`p-4 rounded-lg border ${allAchieved ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm">
                          {agent.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{agent.name}</h4>
                        <div className="flex items-center gap-1">
                          {allAchieved ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-500">Todas as metas atingidas</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Metas pendentes</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingGoals(goals);
                          setGoalsDialogOpen(true);
                        }}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {/* Calls Goal */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Chamadas</span>
                          <span className={callsAchieved ? 'text-green-500 font-medium' : ''}>
                            {agent.totalCalls}/{goals.calls_target}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={callsProgress} className="h-2" />
                          {callsAchieved && (
                            <CheckCircle2 className="h-3 w-3 text-green-500 absolute -right-1 -top-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Satisfaction Goal */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Satisfação</span>
                          <span className={satisfactionAchieved ? 'text-green-500 font-medium' : ''}>
                            {agent.avgSatisfaction.toFixed(1)}/{goals.satisfaction_target}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={satisfactionProgress} className="h-2" />
                          {satisfactionAchieved && (
                            <CheckCircle2 className="h-3 w-3 text-green-500 absolute -right-1 -top-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Performance Goal */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Performance</span>
                          <span className={performanceAchieved ? 'text-green-500 font-medium' : ''}>
                            {agent.avgPerformance.toFixed(1)}/{goals.performance_target}
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={performanceProgress} className="h-2" />
                          {performanceAchieved && (
                            <CheckCircle2 className="h-3 w-3 text-green-500 absolute -right-1 -top-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum agente encontrado</p>
              <p className="text-sm">Dados aparecerão quando houver chamadas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead className="text-center">Chamadas</TableHead>
                  <TableHead className="text-center">Duração Média</TableHead>
                  <TableHead className="text-center">Satisfação</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                  <TableHead className="text-center">Pontuação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent, index) => (
                  <TableRow key={agent.name} className={index < 3 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(index)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{agent.totalCalls}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formatDuration(agent.avgDuration)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={agent.avgSatisfaction * 10} 
                          className="h-2 w-16" 
                        />
                        <span className="text-sm font-medium">
                          {agent.avgSatisfaction.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={agent.avgPerformance * 10} 
                          className="h-2 w-16" 
                        />
                        <span className="text-sm font-medium">
                          {agent.avgPerformance.toFixed(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={index === 0 ? 'default' : 'outline'}
                        className={index === 0 ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                      >
                        {agent.score.toFixed(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Badges Showcase */}
      <BadgesShowcase badges={badges} agentBadges={agentBadges} />

      {/* Goals Configuration Dialog */}
      <Dialog open={goalsDialogOpen} onOpenChange={setGoalsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Metas - {editingGoals?.agent_name}</DialogTitle>
          </DialogHeader>
          {editingGoals && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="calls_target">Meta de Chamadas</Label>
                <Input
                  id="calls_target"
                  type="number"
                  min={1}
                  max={500}
                  value={editingGoals.calls_target}
                  onChange={(e) =>
                    setEditingGoals({
                      ...editingGoals,
                      calls_target: Math.max(1, Math.min(500, parseInt(e.target.value) || 1)),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="satisfaction_target">Meta de Satisfação (1-10)</Label>
                <Input
                  id="satisfaction_target"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={editingGoals.satisfaction_target}
                  onChange={(e) =>
                    setEditingGoals({
                      ...editingGoals,
                      satisfaction_target: Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performance_target">Meta de Performance (1-10)</Label>
                <Input
                  id="performance_target"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={editingGoals.performance_target}
                  onChange={(e) =>
                    setEditingGoals({
                      ...editingGoals,
                      performance_target: Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)),
                    })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setGoalsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveGoals}>
                  Salvar Metas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
