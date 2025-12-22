import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Phone,
  Clock,
  Users,
  Tag,
  Star,
  Loader2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { format, subDays, subWeeks, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface CallSession {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  status: string | null;
}

interface CallSummary {
  call_session_id: string;
  overall_sentiment: string | null;
  main_topics: string[] | null;
  customer_satisfaction: number | null;
  agent_performance_score: number | null;
}

type DateRange = 'week' | 'month' | '3months' | 'all';

export default function CallAnalytics() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [summaries, setSummaries] = useState<CallSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, summariesRes] = await Promise.all([
        supabase
          .from('call_sessions')
          .select('id, started_at, duration_seconds, status')
          .eq('status', 'completed')
          .order('started_at', { ascending: false }),
        supabase
          .from('call_summaries')
          .select('call_session_id, overall_sentiment, main_topics, customer_satisfaction, agent_performance_score')
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (summariesRes.error) throw summariesRes.error;

      setSessions(sessionsRes.data || []);
      setSummaries(summariesRes.data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRangeStart = (): Date | null => {
    const now = new Date();
    switch (dateRange) {
      case 'week': return subWeeks(now, 1);
      case 'month': return subMonths(now, 1);
      case '3months': return subMonths(now, 3);
      default: return null;
    }
  };

  const filteredData = useMemo(() => {
    const rangeStart = getDateRangeStart();
    
    const filteredSessions = rangeStart 
      ? sessions.filter(s => isAfter(new Date(s.started_at), rangeStart))
      : sessions;

    const sessionIds = new Set(filteredSessions.map(s => s.id));
    const filteredSummaries = summaries.filter(s => sessionIds.has(s.call_session_id));

    return { sessions: filteredSessions, summaries: filteredSummaries };
  }, [sessions, summaries, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const { sessions: fSessions, summaries: fSummaries } = filteredData;

    // Total calls
    const totalCalls = fSessions.length;

    // Average duration
    const durationsWithValue = fSessions.filter(s => s.duration_seconds && s.duration_seconds > 0);
    const avgDuration = durationsWithValue.length > 0
      ? durationsWithValue.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / durationsWithValue.length
      : 0;

    // Average satisfaction
    const satisfactionScores = fSummaries
      .map(s => s.customer_satisfaction)
      .filter((s): s is number => s !== null);
    const avgSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
      : 0;

    // Average agent performance
    const performanceScores = fSummaries
      .map(s => s.agent_performance_score)
      .filter((s): s is number => s !== null);
    const avgPerformance = performanceScores.length > 0
      ? performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length
      : 0;

    // Sentiment distribution
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    fSummaries.forEach(s => {
      if (s.overall_sentiment === 'positive') sentimentCounts.positive++;
      else if (s.overall_sentiment === 'negative') sentimentCounts.negative++;
      else if (s.overall_sentiment === 'neutral') sentimentCounts.neutral++;
    });

    // Topic frequency
    const topicCounts: Record<string, number> = {};
    fSummaries.forEach(s => {
      s.main_topics?.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Calls per day (last 7 days for chart)
    const callsByDay: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });
    last7Days.forEach(day => callsByDay[day] = 0);
    fSessions.forEach(s => {
      const day = format(new Date(s.started_at), 'yyyy-MM-dd');
      if (callsByDay[day] !== undefined) {
        callsByDay[day]++;
      }
    });

    return {
      totalCalls,
      avgDuration,
      avgSatisfaction,
      avgPerformance,
      sentimentCounts,
      topTopics,
      callsByDay: last7Days.map(day => ({
        date: format(new Date(day), 'dd/MM', { locale: ptBR }),
        calls: callsByDay[day]
      })),
      summariesCount: fSummaries.length
    };
  }, [filteredData]);

  const sentimentChartData = [
    { name: 'Positivo', value: stats.sentimentCounts.positive, color: 'hsl(var(--success))' },
    { name: 'Neutro', value: stats.sentimentCounts.neutral, color: 'hsl(var(--warning))' },
    { name: 'Negativo', value: stats.sentimentCounts.negative, color: 'hsl(var(--destructive))' }
  ].filter(d => d.value > 0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics de Chamadas</h1>
          <p className="text-muted-foreground">
            Estatísticas e insights das chamadas atendidas
          </p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="3months">Últimos 3 meses</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              {stats.summariesCount} com resumo IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            <p className="text-xs text-muted-foreground">
              por chamada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSatisfaction.toFixed(1)}/10</div>
            <Progress value={stats.avgSatisfaction * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Performance Agentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerformance.toFixed(1)}/10</div>
            <Progress value={stats.avgPerformance * 10} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls per Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Chamadas por Dia
            </CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.callsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribuição de Sentimento
            </CardTitle>
            <CardDescription>Análise geral das chamadas</CardDescription>
          </CardHeader>
          <CardContent>
            {sentimentChartData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados de sentimento disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Cards and Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes de Sentimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success" />
                <span className="text-sm">Positivo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.sentimentCounts.positive}</span>
                <Badge variant="outline" className="text-success">
                  {stats.summariesCount > 0 
                    ? `${Math.round((stats.sentimentCounts.positive / stats.summariesCount) * 100)}%`
                    : '0%'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning" />
                <span className="text-sm">Neutro</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.sentimentCounts.neutral}</span>
                <Badge variant="outline" className="text-warning">
                  {stats.summariesCount > 0 
                    ? `${Math.round((stats.sentimentCounts.neutral / stats.summariesCount) * 100)}%`
                    : '0%'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="text-sm">Negativo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stats.sentimentCounts.negative}</span>
                <Badge variant="outline" className="text-destructive">
                  {stats.summariesCount > 0 
                    ? `${Math.round((stats.sentimentCounts.negative / stats.summariesCount) * 100)}%`
                    : '0%'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Topics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Tópicos Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topTopics.length > 0 ? (
              <div className="space-y-3">
                {stats.topTopics.map(([topic, count], index) => {
                  const maxCount = stats.topTopics[0][1];
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={topic} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground w-5">{index + 1}.</span>
                          {topic}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Sem dados de tópicos disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
