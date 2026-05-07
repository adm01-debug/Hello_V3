import { Trophy, Medal, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { formatDurationFriendly } from '@/lib/utils';
import { AgentStats } from '@/hooks/useAgentRanking';

interface Props {
  agents: AgentStats[];
  isLoading: boolean;
}

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const getRankIcon = (index: number) => {
  switch (index) {
    case 0: return <Trophy className="h-6 w-6 text-warning" />;
    case 1: return <Medal className="h-6 w-6 text-gray-400" />;
    case 2: return <Medal className="h-6 w-6 text-amber-600" />;
    default: return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  }
};

export function AgentRankingTable({ agents, isLoading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking Completo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                    <div className="flex items-center justify-center w-8">{getRankIcon(index)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(agent.name)}</AvatarFallback></Avatar>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center"><Badge variant="secondary">{agent.totalCalls}</Badge></TableCell>
                   <TableCell className="text-center text-muted-foreground">{formatDurationFriendly(agent.avgDuration)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={agent.avgSatisfaction * 10} className="h-2 w-16" />
                      <span className="text-sm font-medium">{agent.avgSatisfaction.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={agent.avgPerformance * 10} className="h-2 w-16" />
                      <span className="text-sm font-medium">{agent.avgPerformance.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={index === 0 ? 'default' : 'outline'} className={index === 0 ? 'bg-warning hover:bg-warning/90' : ''}>
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
  );
}
