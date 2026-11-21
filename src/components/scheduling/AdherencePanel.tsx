import { useAdherence } from '@/hooks/useAdherence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, AlertTriangle } from 'lucide-react';

function pctClass(p: number): string {
  if (p >= 85) return 'bg-success';
  if (p >= 70) return 'bg-warning';
  return 'bg-destructive';
}

export function AdherencePanel() {
  const { data, isLoading, error } = useAdherence();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-4 w-4" />Aderência à Escala
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-4 w-3/4" /></div>
        ) : error || !data?.adherence ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />Sem dados de aderência para hoje.
          </p>
        ) : (
          Object.entries(data.adherence).map(([agent, a]) => (
            <div key={agent} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{agent}</span>
                <Badge variant={a.adherence_percent >= 85 ? 'default' : a.adherence_percent >= 70 ? 'secondary' : 'destructive'}>
                  {a.adherence_percent}%
                </Badge>
              </div>
              <Progress value={a.adherence_percent} className={pctClass(a.adherence_percent)} />
              <p className="text-xs text-muted-foreground">
                {a.actual_minutes}/{a.scheduled_minutes} min
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}