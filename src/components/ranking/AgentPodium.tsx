import { Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AgentStats } from '@/hooks/useAgentRanking';

interface Props {
  agents: AgentStats[];
}

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export function AgentPodium({ agents }: Props) {
  const topAgents = agents.slice(0, 3);
  if (topAgents.length < 3) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" /> Pódio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-center gap-4 py-6">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <Avatar className="h-16 w-16 mb-2 border-4 border-muted-foreground/40">
              <AvatarFallback className="text-lg bg-muted-foreground/20">{getInitials(topAgents[1].name)}</AvatarFallback>
            </Avatar>
            <Medal className="h-8 w-8 text-muted-foreground mb-1" />
            <span className="font-semibold text-center">{topAgents[1].name}</span>
            <span className="text-sm text-muted-foreground">{topAgents[1].score.toFixed(1)} pts</span>
            <div className="h-20 w-24 bg-muted-foreground/20 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">2º</span>
            </div>
          </div>
          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <Avatar className="h-20 w-20 mb-2 border-4 border-warning">
              <AvatarFallback className="text-xl bg-warning/20">{getInitials(topAgents[0].name)}</AvatarFallback>
            </Avatar>
            <Trophy className="h-10 w-10 text-warning mb-1" />
            <span className="font-bold text-lg text-center">{topAgents[0].name}</span>
            <span className="text-sm text-muted-foreground">{topAgents[0].score.toFixed(1)} pts</span>
            <div className="h-28 w-28 bg-warning/20 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-3xl font-bold text-warning">1º</span>
            </div>
          </div>
          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <Avatar className="h-14 w-14 mb-2 border-4 border-warning">
              <AvatarFallback className="text-base bg-warning/20">{getInitials(topAgents[2].name)}</AvatarFallback>
            </Avatar>
            <Medal className="h-7 w-7 text-warning mb-1" />
            <span className="font-semibold text-center">{topAgents[2].name}</span>
            <span className="text-sm text-muted-foreground">{topAgents[2].score.toFixed(1)} pts</span>
            <div className="h-14 w-20 bg-warning/20 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-xl font-bold text-warning">3º</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
