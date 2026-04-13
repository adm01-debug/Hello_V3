import { Phone, Clock, Calendar, User, Tag, ChevronRight, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SessionWithSummary } from '@/hooks/useCallHistory';

interface Props {
  sessions: SessionWithSummary[];
  isLoading: boolean;
  activeFiltersCount: number;
  onSessionClick: (session: SessionWithSummary) => void;
  onClearFilters: () => void;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getSentimentBadge = (sentiment: string | null | undefined) => {
  if (!sentiment) return null;
  return (
    <Badge variant="outline" className={cn('text-xs',
      sentiment === 'positive' ? 'text-success border-success/50' :
      sentiment === 'negative' ? 'text-destructive border-destructive/50' : 'text-warning border-warning/50'
    )}>
      {sentiment === 'positive' ? <TrendingUp className="h-3 w-3 mr-1" /> :
       sentiment === 'negative' ? <TrendingDown className="h-3 w-3 mr-1" /> :
       <Minus className="h-3 w-3 mr-1" />}
      {sentiment === 'positive' ? 'Positivo' : sentiment === 'negative' ? 'Negativo' : 'Neutro'}
    </Badge>
  );
};

export function CallSessionsList({ sessions, isLoading, activeFiltersCount, onSessionClick, onClearFilters }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" /> Chamadas Recentes
          <Badge variant="secondary" className="ml-2">{sessions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Phone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{activeFiltersCount > 0 ? 'Nenhuma chamada encontrada com os filtros aplicados' : 'Nenhuma chamada encontrada'}</p>
            {activeFiltersCount > 0 && <button className="text-primary underline text-sm mt-2" onClick={onClearFilters}>Limpar filtros</button>}
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => onSessionClick(session)}>
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', session.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.caller_name || 'Desconhecido'}</span>
                        <Badge variant="outline" className="text-xs">{session.status === 'completed' ? 'Concluída' : 'Em andamento'}</Badge>
                        {getSentimentBadge(session.summary?.overall_sentiment)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{session.caller_phone || 'Sem número'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{session.agent_name || 'N/A'}</span>
                        {session.summary?.main_topics && session.summary.main_topics.length > 0 && (
                          <><span>•</span><span className="flex items-center gap-1"><Tag className="h-3 w-3" />{session.summary.main_topics.slice(0, 2).join(', ')}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3 text-muted-foreground" />{format(new Date(session.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3 w-3" />{formatDuration(session.duration_seconds)}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
