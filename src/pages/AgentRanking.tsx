import { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Phone, Clock, Star, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentStats {
  name: string;
  totalCalls: number;
  avgDuration: number;
  avgSatisfaction: number;
  avgPerformance: number;
  completedCalls: number;
  score: number;
}

export default function AgentRanking() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('score');
  const [period, setPeriod] = useState<string>('all');

  useEffect(() => {
    fetchAgentStats();
  }, [period]);

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
        <div>
          <h1 className="text-3xl font-bold">Ranking de Agentes</h1>
          <p className="text-muted-foreground">
            Comparativo de desempenho entre os agentes
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Top 3 Podium */}
      {topAgents.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Pódio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4 py-6">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="h-16 w-16 mb-2 border-4 border-gray-400">
                  <AvatarFallback className="text-lg bg-gray-400/20">
                    {getInitials(topAgents[1]?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <Medal className="h-8 w-8 text-gray-400 mb-1" />
                <span className="font-semibold text-center">{topAgents[1]?.name}</span>
                <span className="text-sm text-muted-foreground">
                  {topAgents[1]?.score.toFixed(1)} pts
                </span>
                <div className="h-20 w-24 bg-gray-400/20 rounded-t-lg mt-2 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400">2º</span>
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
    </div>
  );
}
