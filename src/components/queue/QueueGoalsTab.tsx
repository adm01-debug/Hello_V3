import { ReactNode } from 'react';
import { Target, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GoalStatus } from '@/hooks/useQueueMetrics';

interface Props {
  goalStatuses: GoalStatus[];
  formatGoalValue: (value: number, metricType: string) => string;
  setActiveTab: (tab: string) => void;
  getStatusColor: (status: 'ok' | 'warning' | 'critical') => string;
  getStatusIcon: (status: 'ok' | 'warning' | 'critical') => ReactNode;
}

export function QueueGoalsTab({ goalStatuses, formatGoalValue, setActiveTab, getStatusColor, getStatusIcon }: Props) {
  if (goalStatuses.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhuma meta ativa configurada</p>
          <Button className="mt-4" onClick={() => setActiveTab('settings')}>
            <Settings className="h-4 w-4 mr-2" />Configurar Metas
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {goalStatuses.map(({ goal, currentValue, status }) => {
        const progress = goal.comparison_operator === 'gte'
          ? Math.min(100, (currentValue / goal.target_value) * 100)
          : Math.max(0, 100 - ((currentValue / goal.target_value) * 100));

        return (
          <Card key={goal.id} className={getStatusColor(status)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(status)}{goal.name}
                </CardTitle>
                <Badge variant={status === 'ok' ? 'default' : status === 'warning' ? 'outline' : 'destructive'}>
                  {status === 'ok' ? 'Atingida' : status === 'warning' ? 'Aviso' : 'Crítico'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-bold">{formatGoalValue(currentValue, goal.metric_type)}</p>
                    <p className="text-sm text-muted-foreground">Meta: {formatGoalValue(goal.target_value, goal.metric_type)}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-warning">Aviso: {formatGoalValue(goal.warning_threshold, goal.metric_type)}</p>
                    <p className="text-destructive">Crítico: {formatGoalValue(goal.critical_threshold, goal.metric_type)}</p>
                  </div>
                </div>
                <Progress value={progress} className={status === 'ok' ? '' : status === 'warning' ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
