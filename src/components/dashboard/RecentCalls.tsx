import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  MoreHorizontal 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyCallsState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentCallsData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function RecentCalls() {
  const { data: recentCalls, isLoading } = useRecentCallsData();

  const getCallIcon = (status: string | null) => {
    if (status === 'missed' || status === 'abandoned') return PhoneMissed;
    return PhoneIncoming;
  };

  const getCallColor = (status: string | null) => {
    switch (status) {
      case 'missed':
      case 'abandoned':
        return 'text-destructive bg-destructive/10';
      case 'completed':
        return 'text-success bg-success/10';
      case 'active':
      case 'ringing':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Chamadas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }

  const calls = (recentCalls || []).slice(0, 5);

  return (
    <Card className="card-premium border-none">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/5 text-primary/80">
            <PhoneIncoming className="h-5 w-5" />
          </div>
          Recentes
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
          Histórico completo
        </Button>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <EmptyCallsState 
            description="Nenhuma chamada registrada ainda. Quando houver chamadas, elas aparecerão aqui."
            size="sm"
          />
        ) : (
          <div className="space-y-4">
            {calls.map((call) => {
              const Icon = getCallIcon(call.status);
              
              return (
                <div
                  key={call.id}
                   className="group/item flex items-center justify-between rounded-2xl border border-white/[0.03] bg-muted/10 p-4 transition-all duration-500 hover:bg-muted/20 hover:border-primary/20 hover:translate-x-1.5"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                       'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-3 shadow-sm group-hover/item:shadow-md',
                      getCallColor(call.status)
                    )}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    
                    <div>
                      <p className="font-medium">{call.caller_name || 'Desconhecido'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{call.caller_phone || '—'}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(call.started_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {call.duration_seconds && call.duration_seconds > 0 && (
                      <span className="font-mono text-sm text-muted-foreground">
                        {formatDuration(call.duration_seconds)}
                      </span>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      aria-label="Mais opções"
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
