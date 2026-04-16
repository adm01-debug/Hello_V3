import { useState } from 'react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Library, Loader2, Calendar, Headphones, Filter, ChevronLeft, ChevronRight, DollarSign, Swords, AlertTriangle, ArrowRight } from 'lucide-react';
import { useCallSearch, type CallSearchFilters } from '@/hooks/useCallSearch';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { HighlightedSnippet } from '@/components/conversation-intelligence/HighlightedSnippet';

const PAGE_SIZE = 20;

const MOMENT_OPTIONS = [
  { value: 'all', label: 'Todos os momentos', icon: Library },
  { value: 'price', label: 'Preço mencionado', icon: DollarSign },
  { value: 'competitor', label: 'Concorrente citado', icon: Swords },
  { value: 'objection', label: 'Objeção detectada', icon: AlertTriangle },
  { value: 'next_step', label: 'Próximo passo definido', icon: ArrowRight },
];

export default function CallLibrary() {
  usePageTitle('Biblioteca de Calls');
  const [query, setQuery] = useState('');
  const [agent, setAgent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [momentType, setMomentType] = useState('all');
  const [page, setPage] = useState(0);
  const { results, total, loading, error, search } = useCallSearch();

  const buildFilters = (): CallSearchFilters => ({
    agentName: agent.trim() || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined,
    minDurationSeconds: minDuration ? Number(minDuration) * 60 : undefined,
    momentType: momentType !== 'all' ? momentType : undefined,
  });

  const runSearch = (newPage = 0) => {
    setPage(newPage);
    search(query, buildFilters(), { limit: PAGE_SIZE, offset: newPage * PAGE_SIZE });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <NeonPageLayout>
      <NeonPageHeader
        icon={<Library className="h-5 w-5" />}
        title="Biblioteca de Calls"
        description="Busque conversas por palavra-chave em toda a base"
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Card className="p-4 h-fit lg:sticky lg:top-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Filtros</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Agente</label>
              <Input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Nome do agente" className="h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Período</label>
              <div className="space-y-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duração mínima (min)</label>
              <Input type="number" min="0" value={minDuration} onChange={(e) => setMinDuration(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Momento-chave</label>
              <Select value={momentType} onValueChange={setMomentType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => runSearch(0)} disabled={loading || !query.trim()} className="w-full">
              Aplicar filtros
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar (ex: preço, contrato, cancelamento…)"
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </form>
          </Card>

          {error && (
            <Card className="p-4 border-destructive/40 bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Resultados</h3>
              <Badge variant="outline">{total}</Badge>
            </div>

            <Tabs defaultValue="list">
              <TabsList className="mb-3">
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="moments">Por Momento-Chave</TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Buscando…
                  </div>
                ) : results.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    {query ? 'Nenhum resultado encontrado.' : 'Digite uma palavra-chave para começar.'}
                  </p>
                ) : (
                  <>
                    <ScrollArea className="h-[480px] pr-4">
                      <div className="space-y-3">
                        {results.map((r) => (
                          <Link key={r.id} to={`/call-history?session=${r.call_session_id}`}>
                            <Card className="p-3 hover:border-primary/50 transition-colors cursor-pointer">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
                                {r.agent_name && (
                                  <span className="flex items-center gap-1"><Headphones className="h-3 w-3" />{r.agent_name}</span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(r.created_at).toLocaleString('pt-BR')}
                                </span>
                                {r.duration_seconds && <span>{Math.floor(r.duration_seconds / 60)} min</span>}
                              </div>
                              <p className="text-sm leading-relaxed">
                                <HighlightedSnippet text={r.snippet} terms={r.highlight_terms} />
                              </p>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </ScrollArea>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => runSearch(page - 1)}>
                          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages || loading} onClick={() => runSearch(page + 1)}>
                          Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="moments">
                <div className="grid gap-3 sm:grid-cols-2">
                  {MOMENT_OPTIONS.filter(o => o.value !== 'all').map((m) => {
                    const Icon = m.icon;
                    return (
                      <Card
                        key={m.value}
                        className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => { setMomentType(m.value); runSearch(0); }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{m.label}</p>
                            <p className="text-xs text-muted-foreground">Buscar chamadas com este momento</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Selecione um momento-chave acima para filtrar a busca. Combine com palavra-chave para resultados precisos.
                </p>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </NeonPageLayout>
  );
}
