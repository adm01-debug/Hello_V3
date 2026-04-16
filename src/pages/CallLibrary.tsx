import { useState } from 'react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Library, Loader2, Calendar, Headphones } from 'lucide-react';
import { useCallSearch } from '@/hooks/useCallSearch';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';

export default function CallLibrary() {
  usePageTitle('Biblioteca de Calls');
  const [query, setQuery] = useState('');
  const [agent, setAgent] = useState('');
  const { results, loading, error, search } = useCallSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query, agent || undefined);
  };

  return (
    <NeonPageLayout>
      <NeonPageHeader
        icon={<Library className="h-5 w-5" />}
        title="Biblioteca de Calls"
        description="Busque conversas por palavra-chave em toda a base"
      />

      <Card className="p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar (ex: preço, contrato, cancelamento…)"
              className="pl-9"
            />
          </div>
          <Input
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            placeholder="Filtrar por agente (opcional)"
            className="md:w-64"
          />
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
          </Button>
        </form>
      </Card>

      {error && (
        <Card className="p-4 mb-4 border-destructive/40 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Resultados</h3>
          <Badge variant="outline">{results.length}</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Buscando…
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            {query ? 'Nenhum resultado encontrado.' : 'Digite uma palavra-chave para começar.'}
          </p>
        ) : (
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
                    <p className="text-sm">{r.snippet}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </NeonPageLayout>
  );
}
