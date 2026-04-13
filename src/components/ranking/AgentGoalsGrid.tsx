import { Target, CheckCircle2, XCircle, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AgentStats, AgentGoals } from '@/hooks/useAgentRanking';

interface Props {
  agents: AgentStats[];
  getGoalsForAgent: (name: string) => AgentGoals;
  onEditGoals: (goals: AgentGoals) => void;
}

export function AgentGoalsGrid({ agents, getGoalsForAgent, onEditGoals }: Props) {
  if (agents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" /> Metas vs Realizado
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
              <div key={agent.name} className={`p-4 rounded-lg border ${allAchieved ? 'border-success/30 bg-success/5' : 'border-border'}`}>
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
                        <><CheckCircle2 className="h-3 w-3 text-success" /><span className="text-xs text-success">Todas as metas atingidas</span></>
                      ) : (
                        <><XCircle className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Metas pendentes</span></>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditGoals(goals)}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <GoalProgressBar label="Chamadas" current={agent.totalCalls} target={goals.calls_target} progress={callsProgress} achieved={callsAchieved} />
                  <GoalProgressBar label="Satisfação" current={agent.avgSatisfaction} target={goals.satisfaction_target} progress={satisfactionProgress} achieved={satisfactionAchieved} isDecimal />
                  <GoalProgressBar label="Performance" current={agent.avgPerformance} target={goals.performance_target} progress={performanceProgress} achieved={performanceAchieved} isDecimal />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function GoalProgressBar({ label, current, target, progress, achieved, isDecimal }: {
  label: string; current: number; target: number; progress: number; achieved: boolean; isDecimal?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={achieved ? 'text-success font-medium' : ''}>
          {isDecimal ? current.toFixed(1) : current}/{target}
        </span>
      </div>
      <div className="relative">
        <Progress value={progress} className="h-2" />
        {achieved && <CheckCircle2 className="h-3 w-3 text-success absolute -right-1 -top-0.5" />}
      </div>
    </div>
  );
}
