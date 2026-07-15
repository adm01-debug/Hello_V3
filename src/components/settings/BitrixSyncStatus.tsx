import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  actionLabel,
  type SyncAttempt,
  type SyncAttemptStatus,
} from '@/lib/bitrix/sync-log';

type Row = Database['public']['Tables']['crm_sync_queue']['Row'];

const toAttempt = (r: Row): SyncAttempt => ({
  id: r.id,
  action: r.action,
  status: (r.status as SyncAttemptStatus) ?? 'pending',
  attempts: r.attempts ?? 0,
  last_error: r.last_error ?? null,
  created_at: r.created_at,
  updated_at: r.updated_at,
  payload: r.payload ?? null,
});

const StatusBadge = ({ status }: { status: SyncAttemptStatus }) => {
  switch (status) {
    case 'in_progress':
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Em progresso
        </Badge>
      );
    case 'success':
      return (
        <Badge className="gap-1 bg-success/10 text-success border border-success/20">
          <CheckCircle2 className="h-3 w-3" /> Sucesso
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Falha
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> Pendente
        </Badge>
      );
  }
};

const summarize = (attempts: SyncAttempt[]) => ({
  total: attempts.length,
  inProgress: attempts.filter((a) => a.status === 'in_progress').length,
  success: attempts.filter((a) => a.status === 'success').length,
  failed: attempts.filter((a) => a.status === 'failed').length,
  pending: attempts.filter((a) => a.status === 'pending').length,
});

export function BitrixSyncStatus() {
  const [openError, setOpenError] = useState<string | null>(null);

  const {
    data: attempts = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['bitrix-sync-attempts'],
    queryFn: async (): Promise<SyncAttempt[]> => {
      const { data, error } = await supabase
        .from('crm_sync_queue')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data as Row[]).map(toAttempt);
    },
    staleTime: 15_000,
  });

  // Realtime — atualiza quando a fila muda
  useEffect(() => {
    const channel = supabase
      .channel('crm-sync-queue-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_sync_queue' },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const summary = useMemo(() => summarize(attempts), [attempts]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Status de sincronização Bitrix24
            </CardTitle>
            <CardDescription>
              Últimas 30 tentativas — atualização em tempo real
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-3">
          <StatusPill label="Em progresso" count={summary.inProgress} tone="info" />
          <StatusPill label="Sucesso" count={summary.success} tone="success" />
          <StatusPill label="Falha" count={summary.failed} tone="destructive" />
          <StatusPill label="Pendente" count={summary.pending} tone="muted" />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Carregando histórico…
          </p>
        ) : attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma tentativa registrada ainda. Execute uma sincronização para
            começar.
          </p>
        ) : (
          <ScrollArea className="h-[380px] pr-3">
            <ul className="space-y-2">
              {attempts.map((a) => {
                const failed = a.status === 'failed' && a.last_error;
                const open = openError === a.id;
                return (
                  <li
                    key={a.id}
                    className="rounded-md border bg-card/50 p-3 hover:bg-card transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {actionLabel(a.action)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(a.updated_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {a.attempts > 1 && ` · ${a.attempts} tentativas`}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>

                    {failed && (
                      <Collapsible
                        open={open}
                        onOpenChange={(o) => setOpenError(o ? a.id : null)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <AlertCircle className="h-3.5 w-3.5 mr-1" />
                            {open ? 'Ocultar erro' : 'Ver mensagem de erro'}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-destructive/5 border border-destructive/20 p-3 text-xs text-destructive font-mono">
                            {a.last_error}
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

const StatusPill = ({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'success' | 'destructive' | 'info' | 'muted';
}) => {
  const toneClass = {
    success: 'bg-success/10 text-success border-success/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    muted: 'bg-muted text-muted-foreground border-border',
  }[tone];
  return (
    <div
      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${toneClass}`}
      aria-label={`${label}: ${count}`}
    >
      {label}: <span className="font-mono">{count}</span>
    </div>
  );
};
