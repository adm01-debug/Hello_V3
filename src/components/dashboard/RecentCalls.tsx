import { PhoneIncoming, PhoneMissed, MoreHorizontal, Eye, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyCallsState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { safeFormatDistanceToNow } from "@/lib/safe-date";
import { useRecentCallsData } from '@/hooks/useDashboardData';
import { cn, formatDuration } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function RecentCalls() {
  const { data: recentCalls, isLoading } = useRecentCallsData();
  const navigate = useNavigate();

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Chamadas Recentes</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
          Ver todas
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
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
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
                          {safeFormatDistanceToNow(call.started_at, { 
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
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Mais opções da chamada de ${call.caller_name || 'Desconhecido'}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => navigate(`/history?session=${call.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver no histórico
                        </DropdownMenuItem>
                        {call.caller_phone && (
                          <DropdownMenuItem
                            onSelect={() => {
                              void navigator.clipboard
                                ?.writeText(call.caller_phone as string)
                                .then(() => toast.success('Número copiado', { description: call.caller_phone as string }))
                                .catch(() => toast.error('Não foi possível copiar o número'));
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar número
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
