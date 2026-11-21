import { useCoachingAssignments } from '@/hooks/useCoachingAssignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { safeToLocaleDateString } from '@/lib/safe-date';

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'default',
};

export function CoachingAssignmentsPanel() {
  const { assignments, isLoading, complete } = useCoachingAssignments();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma atribuição de coaching pendente.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.filter((a) => a.status !== 'completed').map((a) => (
        <Card key={a.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{a.title}</span>
              <Badge variant={PRIORITY_VARIANT[a.priority.toLowerCase()] ?? 'secondary'}>
                {a.priority}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Agente: {a.agent_name}</span>
              {a.due_at && <span>Prazo: {safeToLocaleDateString(a.due_at)}</span>}
            </div>
            {a.description && <p className="text-sm">{a.description}</p>}
            <Button size="sm" onClick={() => complete({ id: a.id })}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          </CardContent>
        </Card>
      ))}
      {assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Concluídas ({assignments.filter((a) => a.status === 'completed').length})
            </CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}