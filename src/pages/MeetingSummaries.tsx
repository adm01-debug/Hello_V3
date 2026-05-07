import { useState, useMemo } from 'react';
import { Sparkles, Search, Filter, AlertCircle, ListChecks, Phone } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMeetingSummariesList } from '@/hooks/useMeetingSummary';
import { MeetingSummaryCard } from '@/components/calls/MeetingSummaryCard';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function MeetingSummaries() {
  usePageTitle('Resumos IA de Reuniões');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'followup'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const { data: summaries = [], isLoading } = useMeetingSummariesList({
    followUpOnly: filter === 'followup',
    search: search || undefined,
    limit: 100,
  });

  const stats = useMemo(() => {
    const followups = summaries.filter((s: any) => s.follow_up_required).length;
    const totalActions = summaries.reduce(
      (sum: number, s: any) => sum + (s.action_items?.length ?? 0),
      0
    );
    return { total: summaries.length, followups, totalActions };
  }, [summaries]);

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Resumos IA de Reuniões"
        description="Notas executivas pós-chamada geradas automaticamente"
        icon={<Sparkles />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total resumos</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Follow-ups pendentes
          </div>
          <div className="text-3xl font-bold text-warning">{stats.followups}</div>
        </Card>
        <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <ListChecks className="h-3 w-3" /> Itens de ação
          </div>
          <div className="text-3xl font-bold text-primary">{stats.totalActions}</div>
        </Card>
      </div>

      <Card className="p-4 bg-card/50 backdrop-blur border-primary/20 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no conteúdo dos resumos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5"><Filter className="h-3 w-3" /> Todos</TabsTrigger>
              <TabsTrigger value="followup" className="gap-1.5"><AlertCircle className="h-3 w-3" /> Follow-up</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <ScrollArea className="h-[calc(100vh-380px)]">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : summaries.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Sparkles />}
                    title="Nenhum resumo"
                    description="Os resumos serão gerados automaticamente após chamadas com 60s+ de duração."
                  />
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {summaries.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s.call_session_id)}
                      className={`w-full text-left rounded-lg p-3 border transition-all ${
                        selected === s.call_session_id
                          ? 'bg-primary/15 border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.2)]'
                          : 'bg-background/40 border-border/40 hover:bg-background/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="text-sm font-medium truncate">
                            {s.call_sessions?.caller_name || s.call_sessions?.caller_phone || 'Cliente'}
                          </span>
                        </div>
                        {s.follow_up_required && (
                          <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                        {s.summary || 'Sem resumo'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{s.call_sessions?.agent_name || '—'}</span>
                        <span>{format(new Date(s.generated_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.action_items?.length > 0 && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {s.action_items.length} ações
                          </Badge>
                        )}
                        {s.topics_discussed?.slice(0, 2).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[10px] h-4 px-1.5">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        <div className="lg:col-span-7">
          {selected ? (
            <MeetingSummaryCard callSessionId={selected} />
          ) : (
            <Card className="p-12 bg-card/50 backdrop-blur border-primary/20 flex flex-col items-center text-center gap-3">
              <Sparkles className="h-12 w-12 text-primary/50" />
              <h3 className="font-semibold">Selecione um resumo</h3>
              <p className="text-sm text-muted-foreground">Escolha à esquerda para ver detalhes completos.</p>
            </Card>
          )}
        </div>
      </div>
    </NeonPageLayout>
  );
}
