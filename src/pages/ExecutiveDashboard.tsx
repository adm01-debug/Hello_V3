import { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Target,
  BarChart3,
  Calendar,
  RefreshCw,
  Pause,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface DashboardMetrics {
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
  // Hold metrics
  totalHoldTime: number;
  avgHoldTime: number;
  holdCount: number;
  holdRate: number;
  holdAlerts: number;
}

interface CallsByDay {
  date: string;
  calls: number;
  completed: number;
}

interface SatisfactionTrend {
  date: string;
  satisfaction: number;
  performance: number;
}

interface SentimentData {
  name: string;
  value: number;
}

interface TopAgent {
  name: string;
  calls: number;
  satisfaction: number;
  performance: number;
}

interface GoalsComparison {
  name: string;
  callsTarget: number;
  callsActual: number;
  satisfactionTarget: number;
  satisfactionActual: number;
  performanceTarget: number;
  performanceActual: number;
}

interface HoldByAgent {
  name: string;
  holdTime: number;
  holdCount: number;
  avgHoldTime: number;
}

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCalls: 0,
    totalAgents: 0,
    avgSatisfaction: 0,
    avgPerformance: 0,
    avgDuration: 0,
    completionRate: 0,
    alertsCount: 0,
    criticalAlerts: 0,
    callsTrend: 0,
    satisfactionTrend: 0,
    totalHoldTime: 0,
    avgHoldTime: 0,
    holdCount: 0,
    holdRate: 0,
    holdAlerts: 0,
  });
  const [callsByDay, setCallsByDay] = useState<CallsByDay[]>([]);
  const [satisfactionTrend, setSatisfactionTrend] = useState<SatisfactionTrend[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [goalsComparison, setGoalsComparison] = useState<GoalsComparison[]>([]);
  const [holdByAgent, setHoldByAgent] = useState<HoldByAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<string>('week');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const getDateFilter = useCallback(() => {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return subDays(new Date(), 7);
      case 'month':
        return subDays(new Date(), 30);
      case 'all':
        return new Date(0);
      default:
        return subDays(new Date(), 7);
    }
  }, [period]);

  // Initial fetch and period change
  useEffect(() => {
    fetchAllMetrics();
  }, [period]);

  // Realtime subscription for call_sessions, call_summaries, and call_alerts
  useEffect(() => {
    const channel = supabase
      .channel('executive-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_sessions' },
        () => {
          fetchAllMetrics();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_summaries' },
        () => {
          fetchAllMetrics();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_alerts' },
        () => {
          fetchAllMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period]);


  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return 'hoje';
      case 'week':
        return 'últimos 7 dias';
      case 'month':
        return 'últimos 30 dias';
      case 'all':
        return 'todo período';
      default:
        return 'últimos 7 dias';
    }
  };

  const fetchAllMetrics = async () => {
    setIsLoading(true);
    const dateFilter = getDateFilter();

    // Fetch call sessions with period filter
    let sessionsQuery = supabase.from('call_sessions').select('*');
    if (period !== 'all') {
      sessionsQuery = sessionsQuery.gte('created_at', dateFilter.toISOString());
    }
    const { data: sessions } = await sessionsQuery;

    // Fetch summaries
    const { data: summaries } = await supabase
      .from('call_summaries')
      .select('*');

    // Fetch alerts
    const { data: alerts } = await supabase
      .from('call_alerts')
      .select('*')
      .eq('is_read', false);

    // Fetch agent goals
    const { data: agentGoals } = await supabase
      .from('agent_goals')
      .select('*');

    // Fetch hold events
    let holdQuery = supabase.from('hold_events').select('*');
    if (period !== 'all') {
      holdQuery = holdQuery.gte('created_at', dateFilter.toISOString());
    }
    const { data: holdEvents } = await holdQuery;

    if (!sessions) {
      setIsLoading(false);
      return;
    }

    // Filter summaries to match sessions in period
    const sessionIds = new Set(sessions.map((s) => s.id));
    const filteredSummaries = summaries?.filter((s) => sessionIds.has(s.call_session_id)) || [];

    // Calculate basic metrics
    const totalCalls = sessions.length;
    const uniqueAgents = new Set(sessions.map((s) => s.agent_name).filter(Boolean));
    const totalAgents = uniqueAgents.size;
    const completedCalls = sessions.filter((s) => s.status === 'completed').length;
    const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const avgDuration =
      sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / (totalCalls || 1);

    // Calculate satisfaction and performance from filtered summaries
    const validSummaries = filteredSummaries.filter(
      (s) => s.customer_satisfaction && s.agent_performance_score
    );
    const avgSatisfaction =
      validSummaries.reduce((sum, s) => sum + (s.customer_satisfaction || 0), 0) /
      (validSummaries.length || 1);
    const avgPerformance =
      validSummaries.reduce((sum, s) => sum + (s.agent_performance_score || 0), 0) /
      (validSummaries.length || 1);

    // Alerts count
    const alertsCount = alerts?.length || 0;
    const criticalAlerts = alerts?.filter((a) => a.severity === 'critical').length || 0;

    // Calculate trends (comparing last 7 days to previous 7 days)
    const now = new Date();
    const last7Days = sessions.filter(
      (s) => new Date(s.created_at) >= subDays(now, 7)
    ).length;
    const prev7Days = sessions.filter(
      (s) =>
        new Date(s.created_at) >= subDays(now, 14) &&
        new Date(s.created_at) < subDays(now, 7)
    ).length;
    const callsTrend = prev7Days > 0 ? ((last7Days - prev7Days) / prev7Days) * 100 : 0;

    // Calculate hold metrics
    const totalHoldTime = holdEvents?.reduce((sum, h) => sum + (h.duration_seconds || 0), 0) || 0;
    const holdCount = holdEvents?.length || 0;
    const avgHoldTime = holdCount > 0 ? totalHoldTime / holdCount : 0;
    const callsWithHold = new Set(holdEvents?.map(h => h.call_session_id).filter(Boolean)).size;
    const holdRate = totalCalls > 0 ? (callsWithHold / totalCalls) * 100 : 0;
    
    // Hold alerts (alerts related to hold)
    const holdAlerts = alerts?.filter((a) => 
      a.alert_type?.includes('hold') || 
      a.title?.toLowerCase().includes('espera') ||
      a.title?.toLowerCase().includes('hold')
    ).length || 0;

    // Calculate hold by agent
    const holdByAgentMap = new Map<string, { holdTime: number; holdCount: number }>();
    holdEvents?.forEach((h) => {
      if (!h.agent_name) return;
      const current = holdByAgentMap.get(h.agent_name) || { holdTime: 0, holdCount: 0 };
      current.holdTime += h.duration_seconds || 0;
      current.holdCount += 1;
      holdByAgentMap.set(h.agent_name, current);
    });
    
    const holdByAgentData = Array.from(holdByAgentMap.entries())
      .map(([name, stats]) => ({
        name,
        holdTime: stats.holdTime,
        holdCount: stats.holdCount,
        avgHoldTime: stats.holdCount > 0 ? stats.holdTime / stats.holdCount : 0,
      }))
      .sort((a, b) => b.holdTime - a.holdTime)
      .slice(0, 5);
    
    setHoldByAgent(holdByAgentData);

    setMetrics({
      totalCalls,
      totalAgents,
      avgSatisfaction,
      avgPerformance,
      avgDuration,
      completionRate,
      alertsCount,
      criticalAlerts,
      callsTrend,
      satisfactionTrend: 0,
      totalHoldTime,
      avgHoldTime,
      holdCount,
      holdRate,
      holdAlerts,
    });

    // Calls by day for last 7 days
    const days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now,
    });

    const callsByDayData = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayCalls = sessions.filter(
        (s) => format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr
      );
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        calls: dayCalls.length,
        completed: dayCalls.filter((s) => s.status === 'completed').length,
      };
    });
    setCallsByDay(callsByDayData);

    // Satisfaction and Performance trend by day
    const satisfactionTrendData = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = sessions.filter(
        (s) => format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr
      );
      const daySessionIds = new Set(daySessions.map((s) => s.id));
      const daySummaries = summaries?.filter((s) => daySessionIds.has(s.call_session_id)) || [];
      
      const validDaySummaries = daySummaries.filter(
        (s) => s.customer_satisfaction || s.agent_performance_score
      );
      
      const avgDaySatisfaction = validDaySummaries.length > 0
        ? validDaySummaries.reduce((sum, s) => sum + (s.customer_satisfaction || 0), 0) / validDaySummaries.length
        : 0;
      const avgDayPerformance = validDaySummaries.length > 0
        ? validDaySummaries.reduce((sum, s) => sum + (s.agent_performance_score || 0), 0) / validDaySummaries.length
        : 0;
      
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        satisfaction: Number(avgDaySatisfaction.toFixed(1)),
        performance: Number(avgDayPerformance.toFixed(1)),
      };
    });
    setSatisfactionTrend(satisfactionTrendData);

    // Sentiment distribution
    const sentimentCounts: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };
    summaries?.forEach((s) => {
      if (s.overall_sentiment && sentimentCounts[s.overall_sentiment] !== undefined) {
        sentimentCounts[s.overall_sentiment]++;
      }
    });
    setSentimentData([
      { name: 'Positivo', value: sentimentCounts.positive },
      { name: 'Neutro', value: sentimentCounts.neutral },
      { name: 'Negativo', value: sentimentCounts.negative },
    ]);

    // Top agents
    const agentStats = new Map<
      string,
      { calls: number; satisfaction: number[]; performance: number[] }
    >();

    sessions.forEach((s) => {
      if (!s.agent_name) return;
      const current = agentStats.get(s.agent_name) || {
        calls: 0,
        satisfaction: [],
        performance: [],
      };
      current.calls++;
      agentStats.set(s.agent_name, current);
    });

    // Map session IDs to agent names
    const sessionAgentMap = new Map(sessions.map((s) => [s.id, s.agent_name]));

    summaries?.forEach((summary) => {
      const agentName = sessionAgentMap.get(summary.call_session_id);
      if (!agentName) return;

      const current = agentStats.get(agentName);
      if (!current) return;

      if (summary.customer_satisfaction) {
        current.satisfaction.push(summary.customer_satisfaction);
      }
      if (summary.agent_performance_score) {
        current.performance.push(summary.agent_performance_score);
      }
    });

    const topAgentsData = Array.from(agentStats.entries())
      .map(([name, stats]) => ({
        name,
        calls: stats.calls,
        satisfaction:
          stats.satisfaction.length > 0
            ? stats.satisfaction.reduce((a, b) => a + b, 0) / stats.satisfaction.length
            : 0,
        performance:
          stats.performance.length > 0
            ? stats.performance.reduce((a, b) => a + b, 0) / stats.performance.length
            : 0,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5);

    setTopAgents(topAgentsData);

    // Build goals comparison data
    if (agentGoals && agentGoals.length > 0) {
      const goalsComparisonData = agentGoals.map((goal) => {
        const agentData = topAgentsData.find((a) => a.name === goal.agent_name) || 
          Array.from(agentStats.entries())
            .map(([name, stats]) => ({
              name,
              calls: stats.calls,
              satisfaction:
                stats.satisfaction.length > 0
                  ? stats.satisfaction.reduce((a, b) => a + b, 0) / stats.satisfaction.length
                  : 0,
              performance:
                stats.performance.length > 0
                  ? stats.performance.reduce((a, b) => a + b, 0) / stats.performance.length
                  : 0,
            }))
            .find((a) => a.name === goal.agent_name);
        
        return {
          name: goal.agent_name,
          callsTarget: goal.calls_target,
          callsActual: agentData?.calls || 0,
          satisfactionTarget: Number(goal.satisfaction_target),
          satisfactionActual: Number(agentData?.satisfaction?.toFixed(1) || 0),
          performanceTarget: Number(goal.performance_target),
          performanceActual: Number(agentData?.performance?.toFixed(1) || 0),
        };
      });
      setGoalsComparison(goalsComparisonData);
    }

    setIsLoading(false);
    setLastUpdate(new Date());
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-500 text-sm">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{value.toFixed(1)}%
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-500 text-sm">
          <TrendingDown className="h-4 w-4 mr-1" />
          {value.toFixed(1)}%
        </div>
      );
    }
    return <span className="text-muted-foreground text-sm">--</span>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão consolidada de todas as métricas do call center
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-pulse text-green-500" />
            <span>
              Atualizado: {format(lastUpdate, 'HH:mm:ss', { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalCalls}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {period === 'all' ? 'período total' : `vs ${getPeriodLabel()}`}
              </span>
              <TrendIndicator value={metrics.callsTrend} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">Atendendo chamadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgSatisfaction.toFixed(1)}/10</div>
            <Progress value={metrics.avgSatisfaction * 10} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgPerformance.toFixed(1)}/10</div>
            <Progress value={metrics.avgPerformance * 10} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(metrics.avgDuration)}</div>
            <p className="text-xs text-muted-foreground mt-1">Por chamada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <Progress value={metrics.completionRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.alertsCount}</div>
            <div className="flex items-center gap-2 mt-1">
              {metrics.criticalAlerts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.criticalAlerts} críticos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Geral</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.avgSatisfaction >= 8 && metrics.avgPerformance >= 8 ? (
                <span className="text-success">Atingida</span>
              ) : (
                <span className="text-warning">Em progresso</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Satisfação &amp; Performance ≥ 8</p>
          </CardContent>
        </Card>
      </div>

      {/* Hold Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total em Espera</CardTitle>
            <Pause className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{formatDuration(metrics.totalHoldTime)}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.holdCount} eventos de hold</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Hold</CardTitle>
            <Timer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(metrics.avgHoldTime)}</div>
            <Progress 
              value={Math.min((metrics.avgHoldTime / 120) * 100, 100)} 
              className={`h-2 mt-2 ${metrics.avgHoldTime > 60 ? '[&>div]:bg-red-500' : metrics.avgHoldTime > 30 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
            />
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Hold</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.holdRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Chamadas com espera</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Espera</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.holdAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calls Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Volume de Chamadas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    name="Total"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Concluídas"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Satisfaction Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Tendência de Satisfação e Performance (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={satisfactionTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="satisfaction"
                    name="Satisfação"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="performance"
                    name="Performance"
                    stroke="hsl(var(--chart-4))"
                    fill="hsl(var(--chart-4))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Sentimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {sentimentData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hold by Agent Chart */}
        {holdByAgent.length > 0 && (
          <Card className="border-call-hold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pause className="h-5 w-5 text-call-hold" />
                Tempo em Espera por Agente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={holdByAgent} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Tempo Total' || name === 'Média') {
                          const mins = Math.floor(value / 60);
                          const secs = Math.round(value % 60);
                          return [`${mins}m ${secs}s`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="holdTime" name="Tempo Total" fill="hsl(24, 100%, 50%)" />
                    <Bar dataKey="holdCount" name="Eventos" fill="hsl(24, 80%, 65%)" />
                    <Bar dataKey="avgHoldTime" name="Média" fill="hsl(24, 60%, 75%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top 5 Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topAgents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="calls" name="Chamadas" fill="hsl(var(--chart-1))" />
                <Bar
                  dataKey="satisfaction"
                  name="Satisfação"
                  fill="hsl(var(--chart-2))"
                />
                <Bar
                  dataKey="performance"
                  name="Performance"
                  fill="hsl(var(--chart-3))"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Goals vs Actual Comparison */}
      {goalsComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas vs Realizado por Agente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {goalsComparison.map((agent) => {
                const callsPercent = Math.min((agent.callsActual / agent.callsTarget) * 100, 100);
                const satisfactionPercent = Math.min((agent.satisfactionActual / agent.satisfactionTarget) * 100, 100);
                const performancePercent = Math.min((agent.performanceActual / agent.performanceTarget) * 100, 100);
                
                const callsAchieved = agent.callsActual >= agent.callsTarget;
                const satisfactionAchieved = agent.satisfactionActual >= agent.satisfactionTarget;
                const performanceAchieved = agent.performanceActual >= agent.performanceTarget;
                const allAchieved = callsAchieved && satisfactionAchieved && performanceAchieved;

                // Check if below 60% threshold (critical)
                const callsCritical = callsPercent < 60;
                const satisfactionCritical = satisfactionPercent < 60;
                const performanceCritical = performancePercent < 60;
                const hasCriticalMetric = callsCritical || satisfactionCritical || performanceCritical;

                const getProgressClass = (achieved: boolean, critical: boolean) => {
                  if (achieved) return '[&>div]:bg-success';
                  if (critical) return '[&>div]:bg-destructive';
                  return '[&>div]:bg-warning';
                };

                const getTextClass = (achieved: boolean, critical: boolean) => {
                  if (achieved) return 'text-success font-medium';
                  if (critical) return 'text-destructive font-medium';
                  return 'text-warning font-medium';
                };

                return (
                  <div 
                    key={agent.name} 
                    className={`border rounded-lg p-4 space-y-4 ${
                      hasCriticalMetric 
                        ? 'border-destructive/50 bg-destructive/5' 
                        : allAchieved 
                          ? 'border-success/50 bg-success/5' 
                          : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{agent.name}</h4>
                        {hasCriticalMetric && (
                          <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                        )}
                      </div>
                      {allAchieved ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Todas as metas atingidas
                        </Badge>
                      ) : hasCriticalMetric ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Abaixo da meta crítica
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Em progresso</Badge>
                      )}
                    </div>
                    
                    {hasCriticalMetric && (
                      <div className="flex items-start gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/30">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-red-500">
                          <span className="font-medium">Atenção:</span> Este agente está significativamente abaixo das metas em{' '}
                          {[
                            callsCritical && 'chamadas',
                            satisfactionCritical && 'satisfação',
                            performanceCritical && 'performance',
                          ]
                            .filter(Boolean)
                            .join(', ')}.
                        </div>
                      </div>
                    )}
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Calls */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Chamadas
                            {callsCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          </span>
                          <span className={getTextClass(callsAchieved, callsCritical)}>
                            {agent.callsActual}/{agent.callsTarget}
                          </span>
                        </div>
                        <Progress 
                          value={callsPercent} 
                          className={`h-2 ${getProgressClass(callsAchieved, callsCritical)}`}
                        />
                      </div>

                      {/* Satisfaction */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Satisfação
                            {satisfactionCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          </span>
                          <span className={getTextClass(satisfactionAchieved, satisfactionCritical)}>
                            {agent.satisfactionActual}/{agent.satisfactionTarget}
                          </span>
                        </div>
                        <Progress 
                          value={satisfactionPercent} 
                          className={`h-2 ${getProgressClass(satisfactionAchieved, satisfactionCritical)}`}
                        />
                      </div>

                      {/* Performance */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Performance
                            {performanceCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          </span>
                          <span className={getTextClass(performanceAchieved, performanceCritical)}>
                            {agent.performanceActual}/{agent.performanceTarget}
                          </span>
                        </div>
                        <Progress 
                          value={performancePercent} 
                          className={`h-2 ${getProgressClass(performanceAchieved, performanceCritical)}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
