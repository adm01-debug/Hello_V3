import { Calendar, Sparkles, Check, X } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useShiftSwapSuggestions,
  useGenerateSwapSuggestions,
  useUpdateSwapSuggestion,
} from '@/hooks/useShiftSwapSuggestions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ShiftSwapSuggestions() {
  usePageTitle('Sugestões IA de Turnos');
  const { data: suggestions = [], isLoading } = useShiftSwapSuggestions();
  const generate = useGenerateSwapSuggestions();
  const update = useUpdateSwapSuggestion();

  const pending = suggestions.filter((s) => s.status === 'pending');
  const resolved = suggestions.filter((s) => s.status !== 'pending');

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Sugestões IA de Trocas de Turno"
        description="Otimização automática de cobertura em picos previstos"
        icon={<Sparkles />}
        actions={
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generate.isPending ? 'Analisando…' : 'Gerar sugestões'}
          </Button>
        }
      />

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Pendentes ({pending.length})
          </h2>
          {isLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <EmptyState
              icon={<Sparkles />}
              title="Nenhuma sugestão pendente"
              description="Clique em 'Gerar sugestões' para analisar picos previstos."
            />
          ) : (
            <div className="grid gap-3">
              {pending.map((s) => (
                <Card key={s.id} className="bg-card/50 backdrop-blur border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="border-primary/40">Score +{s.score}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(s.created_at), { locale: ptBR, addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{s.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => update.mutate({ id: s.id, status: 'rejected' })} disabled={update.isPending}>
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                        <Button size="sm" onClick={() => update.mutate({ id: s.id, status: 'approved' })} disabled={update.isPending}>
                          <Check className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {resolved.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Histórico ({resolved.length})</h2>
            <div className="grid gap-2">
              {resolved.map((s) => (
                <Card key={s.id} className="bg-card/30 border-border/40">
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge
                        variant={s.status === 'approved' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {s.status === 'approved' ? 'Aprovada' : s.status === 'rejected' ? 'Rejeitada' : 'Expirada'}
                      </Badge>
                      <span className="text-sm truncate">{s.reason}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {s.approved_at ? formatDistanceToNow(new Date(s.approved_at), { locale: ptBR, addSuffix: true }) : ''}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </NeonPageLayout>
  );
}
