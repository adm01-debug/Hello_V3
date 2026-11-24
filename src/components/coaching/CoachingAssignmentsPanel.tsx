import { useCoachingAssignments } from '@/hooks/useCoachingAssignments';
import { useCoachingTrack } from '@/hooks/useCoachingTrack';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { safeToLocaleDateString } from '@/lib/safe-date';

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'default',
};

export function CoachingAssignmentsPanel() {
  const { assignments, isLoading, complete } = useCoachingAssignments();
  const { generateTrack, isGenerating, rules, lastResult } = useCoachingTrack();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Atribuições de coaching
        </div>
        <PermissionGate module="coaching" action="manage" fallback={null}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateTrack()}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar trilhas automáticas
              </>
            )}
          </Button>
        </PermissionGate>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground space-y-2">
            <p>Nenhuma atribuição de coaching pendente.</p>
            {rules ? (
              <p className="text-xs">
                Regra do coaching automático: são necessárias {rules.min_samples} avaliações com
                nota abaixo de {rules.score_threshold.toFixed(1)} nos últimos {rules.window_days}{' '}
                dias.
              </p>
            ) : (
              <p className="text-xs">
                Use "Gerar trilhas automáticas" para ver a regra aplicada e a contagem de cada
                agente.
              </p>
            )}
            {lastResult && lastResult.skipped.length > 0 && (
              <ul className="mx-auto max-w-md space-y-1 text-left text-xs">
                {lastResult.skipped.map((s) => (
                  <li key={s.agent_name}>
                    <span className="font-medium text-foreground">{s.agent_name}</span>: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4" />
                Concluídas ({assignments.filter((a) => a.status === 'completed').length})
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
