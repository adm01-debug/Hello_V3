import { Phone, Star, Activity, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { GoalsComparison } from '@/hooks/useExecutiveDashboard';

function getProgressClass(achieved: boolean, critical: boolean): string {
  if (achieved) return '[&>div]:bg-success';
  if (critical) return '[&>div]:bg-destructive';
  return '[&>div]:bg-warning';
}

function getTextClass(achieved: boolean, critical: boolean): string {
  if (achieved) return 'text-success font-medium';
  if (critical) return 'text-destructive font-medium';
  return 'text-warning font-medium';
}

export function GoalsComparisonSection({ data }: { data: GoalsComparison[] }) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas vs Realizado por Agente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((agent) => {
            const callsPercent = Math.min((agent.callsActual / agent.callsTarget) * 100, 100);
            const satisfactionPercent = Math.min((agent.satisfactionActual / agent.satisfactionTarget) * 100, 100);
            const performancePercent = Math.min((agent.performanceActual / agent.performanceTarget) * 100, 100);

            const callsAchieved = agent.callsActual >= agent.callsTarget;
            const satisfactionAchieved = agent.satisfactionActual >= agent.satisfactionTarget;
            const performanceAchieved = agent.performanceActual >= agent.performanceTarget;
            const allAchieved = callsAchieved && satisfactionAchieved && performanceAchieved;

            const callsCritical = callsPercent < 60;
            const satisfactionCritical = satisfactionPercent < 60;
            const performanceCritical = performancePercent < 60;
            const hasCritical = callsCritical || satisfactionCritical || performanceCritical;

            return (
              <div
                key={agent.name}
                className={`border rounded-lg p-4 space-y-4 ${
                  hasCritical ? 'border-destructive/50 bg-destructive/5' : allAchieved ? 'border-success/50 bg-success/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{agent.name}</h4>
                    {hasCritical && <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />}
                  </div>
                  {allAchieved ? (
                    <Badge className="bg-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Todas as metas atingidas
                    </Badge>
                  ) : hasCritical ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Abaixo da meta crítica
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Em progresso</Badge>
                  )}
                </div>

                {hasCritical && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm text-destructive">
                      <span className="font-medium">Atenção:</span> Este agente está significativamente abaixo das metas em{' '}
                      {[callsCritical && 'chamadas', satisfactionCritical && 'satisfação', performanceCritical && 'performance']
                        .filter(Boolean)
                        .join(', ')}.
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Chamadas
                        {callsCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </span>
                      <span className={getTextClass(callsAchieved, callsCritical)}>
                        {agent.callsActual}/{agent.callsTarget}
                      </span>
                    </div>
                    <Progress value={callsPercent} className={`h-2 ${getProgressClass(callsAchieved, callsCritical)}`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> Satisfação
                        {satisfactionCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </span>
                      <span className={getTextClass(satisfactionAchieved, satisfactionCritical)}>
                        {agent.satisfactionActual}/{agent.satisfactionTarget}
                      </span>
                    </div>
                    <Progress value={satisfactionPercent} className={`h-2 ${getProgressClass(satisfactionAchieved, satisfactionCritical)}`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Performance
                        {performanceCritical && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </span>
                      <span className={getTextClass(performanceAchieved, performanceCritical)}>
                        {agent.performanceActual}/{agent.performanceTarget}
                      </span>
                    </div>
                    <Progress value={performancePercent} className={`h-2 ${getProgressClass(performanceAchieved, performanceCritical)}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
