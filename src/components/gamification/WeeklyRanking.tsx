import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RankingEntry } from '@/hooks/useGamification';

interface WeeklyRankingProps {
  rankings: RankingEntry[];
  currentAgentId?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-slate-300/20 to-slate-400/20 border-slate-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
    default:
      return 'bg-muted/50';
  }
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export function WeeklyRanking({ rankings, currentAgentId }: WeeklyRankingProps) {
  const maxPoints = Math.max(...rankings.map(r => r.points_earned), 1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ranking Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum dado de ranking ainda</p>
            <p className="text-sm">Complete chamadas para aparecer aqui!</p>
          </div>
        ) : (
          rankings.slice(0, 10).map((entry) => (
            <div
              key={entry.agent_id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                getRankStyle(entry.rank),
                entry.agent_id === currentAgentId && 'ring-2 ring-primary'
              )}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(entry.agent_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium truncate">{entry.agent_name}</p>
                  <span className="text-sm font-bold text-primary">
                    {entry.points_earned} pts
                  </span>
                </div>
                <Progress 
                  value={(entry.points_earned / maxPoints) * 100} 
                  className="h-1.5"
                />
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{entry.total_calls} chamadas</span>
                  <span>{formatDuration(entry.total_duration_seconds)}</span>
                  <span>⭐ {entry.avg_satisfaction?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
