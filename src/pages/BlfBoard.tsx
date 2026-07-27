import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, LayoutGrid, RefreshCw, Search } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useBlfBoard } from '@/hooks/useBlfBoard';
import { BlfLampCard } from '@/components/blf/BlfLampCard';
import { BlfSummaryBar } from '@/components/blf/BlfSummaryBar';
import { LAMP_LABELS, LAMP_STATES, type LampState } from '@/lib/blf';
import { cn } from '@/lib/utils';

const BlfBoard = () => {
  usePageTitle('Painel BLF de Ramais');
  const { lamps, summary, search, setSearch, stateFilter, setStateFilter, isLoading, isError, refetch } =
    useBlfBoard();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LayoutGrid className="h-6 w-6 text-primary" aria-hidden="true" />
            Painel BLF de Ramais
          </h1>
          <p className="text-sm text-muted-foreground">
            Presença em tempo real de {summary.total} ramal(is) — chamadas ativas, espera e vagas de
            estacionamento.
          </p>
        </div>
        <Button variant="outline" onClick={refetch} aria-label="Atualizar painel">
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      <BlfSummaryBar summary={summary} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, ramal ou departamento"
            className="pl-9"
            aria-label="Buscar ramal"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...LAMP_STATES] as Array<LampState | 'all'>).map((state) => (
            <Button
              key={state}
              size="sm"
              variant={stateFilter === state ? 'default' : 'outline'}
              onClick={() => setStateFilter(state)}
              className={cn('text-xs')}
            >
              {state === 'all' ? 'Todos' : LAMP_LABELS[state]}
            </Button>
          ))}
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Não foi possível carregar o painel de ramais. Tente atualizar a página.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => (
            <Skeleton key={key} className="h-24 w-full" />
          ))}
        </div>
      ) : lamps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhum ramal corresponde ao filtro atual.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lamps.map((lamp) => (
            <BlfLampCard key={lamp.agentId} lamp={lamp} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlfBoard;
