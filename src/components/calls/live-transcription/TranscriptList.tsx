import { forwardRef, useMemo, useState } from 'react';
import { Headphones, Search, User, Volume2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { TranscriptEntry } from './types';

interface Props {
  transcripts: TranscriptEntry[];
  isRecording: boolean;
}

type SpeakerFilter = 'all' | 'agent' | 'customer';
type PeriodFilter = 'all' | '1m' | '5m' | '15m';

const PERIOD_SECONDS: Record<PeriodFilter, number | null> = {
  all: null,
  '1m': 60,
  '5m': 5 * 60,
  '15m': 15 * 60,
};

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.trim();
  const lower = text.toLowerCase();
  const target = q.toLowerCase();
  const idx = lower.indexOf(target);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-warning/40 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export const TranscriptList = forwardRef<HTMLDivElement, Props>(({ transcripts, isRecording }, ref) => {
  const [query, setQuery] = useState('');
  const [speaker, setSpeaker] = useState<SpeakerFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const windowSec = PERIOD_SECONDS[period];
    const cutoff = windowSec !== null ? Date.now() - windowSec * 1000 : null;
    return transcripts.filter((e) => {
      if (speaker !== 'all' && e.speaker !== speaker) return false;
      if (cutoff !== null && e.timestamp.getTime() < cutoff) return false;
      if (q && !e.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transcripts, query, speaker, period]);

  const hasActiveFilters = query.trim() !== '' || speaker !== 'all' || period !== 'all';
  const clearFilters = () => {
    setQuery('');
    setSpeaker('all');
    setPeriod('all');
  };

  return (
    <div className="space-y-2">
      {transcripts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar na transcrição..."
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Select value={speaker} onValueChange={(v) => setSpeaker(v as SpeakerFilter)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="agent">Agente</SelectItem>
                <SelectItem value="customer">Cliente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Período todo</SelectItem>
                <SelectItem value="1m">Último 1 min</SelectItem>
                <SelectItem value="5m">Últimos 5 min</SelectItem>
                <SelectItem value="15m">Últimos 15 min</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilters} aria-label="Limpar filtros">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            {filtered.length} de {transcripts.length} mensagens
          </span>
          <Badge variant="secondary" className="text-[10px]">Filtros ativos</Badge>
        </div>
      )}

      <ScrollArea className="h-[180px]" ref={ref}>
        <div className="p-4 space-y-3">
          {transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Volume2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {isRecording
                  ? 'Aguardando fala... A identificação de falantes será feita automaticamente.'
                  : 'Clique em Iniciar para começar a transcrição'}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum resultado para os filtros aplicados</p>
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  entry.speaker === 'agent' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2',
                    entry.speaker === 'agent'
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-warning/10 border border-warning/20',
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {entry.speaker === 'agent' ? (
                      <Headphones className="h-3 w-3 text-primary" />
                    ) : (
                      <User className="h-3 w-3 text-warning" />
                    )}
                    <span
                      className={cn(
                        'text-xs font-medium',
                        entry.speaker === 'agent' ? 'text-primary' : 'text-warning',
                      )}
                    >
                      {entry.speaker === 'agent' ? 'Agente' : 'Cliente'}
                    </span>
                  </div>
                  <p className="text-sm">{highlight(entry.text, query)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entry.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

TranscriptList.displayName = 'TranscriptList';
