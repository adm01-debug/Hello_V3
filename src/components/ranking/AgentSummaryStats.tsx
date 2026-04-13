import { Users, Phone, Star, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AgentStats } from '@/hooks/useAgentRanking';

interface Props {
  agents: AgentStats[];
}

export function AgentSummaryStats({ agents }: Props) {
  const totalCalls = agents.reduce((sum, a) => sum + a.totalCalls, 0);
  const avgTeamSatisfaction = agents.length > 0
    ? agents.reduce((sum, a) => sum + a.avgSatisfaction, 0) / agents.length
    : 0;
  const topAgent = agents[0];

  return (
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
          <Trophy className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">{topAgent?.name || '-'}</div>
          <p className="text-xs text-muted-foreground">Pontuação: {topAgent?.score.toFixed(1) || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}
