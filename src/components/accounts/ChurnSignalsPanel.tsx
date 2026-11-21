import { useState } from 'react';
import { useChurnRisk, type ChurnSignal } from '@/hooks/useChurnRisk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { safeToLocaleDateString } from '@/lib/safe-date';

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'default',
};

export function ChurnSignalsPanel() {
  const { signals, loading, resolve } = useChurnRisk();
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (loading) {
    return <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>;
  }

  if (signals.length === 0) {
    return (
      <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
        Nenhum sinal de churn ativo no momento.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {signals.map((s: ChurnSignal) => (
        <Card key={s.id}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                {s.signal_type}
              </span>
              <Badge variant={SEVERITY_VARIANT[s.severity] ?? 'secondary'}>{s.severity}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{s.description}</p>
            <p className="text-xs text-muted-foreground">
              Detectado em {safeToLocaleDateString(s.detected_at)}
              {typeof s.score_delta === 'number' ? ` · Delta de score: ${s.score_delta}` : ''}
            </p>
            {s.resolution_notes ? (
              <p className="text-sm text-muted-foreground">Resolvido: {s.resolution_notes}</p>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nota de resolução (opcional)"
                  value={notes[s.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
                />
                <Button size="sm" onClick={() => resolve(s.id, notes[s.id] ?? '')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />Resolver
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}