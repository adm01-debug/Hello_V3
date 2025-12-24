import { Target, Phone, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Goal {
  label: string;
  current: number;
  target: number;
  icon: React.ReactNode;
  color: string;
}

interface AgentGoalsProgressProps {
  goals: {
    calls_target: number;
    performance_target: number;
    satisfaction_target: number;
  };
  current: {
    total_calls: number;
    avg_performance: number;
    avg_satisfaction: number;
  };
}

export function AgentGoalsProgress({ goals, current }: AgentGoalsProgressProps) {
  const goalsList: Goal[] = [
    {
      label: 'Chamadas',
      current: current.total_calls,
      target: goals.calls_target,
      icon: <Phone className="h-4 w-4" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Performance',
      current: current.avg_performance,
      target: goals.performance_target,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'bg-green-500',
    },
    {
      label: 'Satisfação',
      current: current.avg_satisfaction,
      target: goals.satisfaction_target,
      icon: <Star className="h-4 w-4" />,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Metas da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goalsList.map((goal, index) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100);
          const isCompleted = percentage >= 100;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'p-1.5 rounded-md text-white',
                    goal.color
                  )}>
                    {goal.icon}
                  </div>
                  <span className="font-medium text-sm">{goal.label}</span>
                </div>
                <div className="text-right">
                  <span className={cn(
                    'font-bold',
                    isCompleted ? 'text-green-500' : 'text-foreground'
                  )}>
                    {goal.label === 'Chamadas' 
                      ? goal.current 
                      : goal.current.toFixed(1)
                    }
                  </span>
                  <span className="text-muted-foreground">
                    /{goal.label === 'Chamadas' ? goal.target : goal.target.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className={cn(
                    'h-2',
                    isCompleted && '[&>div]:bg-green-500'
                  )}
                />
                {isCompleted && (
                  <div className="absolute -right-1 -top-1">
                    <span className="text-green-500 text-xs">✓</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {percentage.toFixed(0)}% concluído
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
