import { useQuery } from '@tanstack/react-query';
import { Clock, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PendingFollowupsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['pending-followups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_callbacks')
        .select('id, caller_name, caller_phone, scheduled_at, priority, status')
        .in('status', ['pending', 'scheduled'])
        .lte('scheduled_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Follow-ups pendentes (24h)
        </CardTitle>
        <Link to="/callbacks" className="text-xs text-primary hover:underline">Ver todos</Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum follow-up agendado nas próximas 24h.</p>
        ) : (
          <ul className="space-y-2">
            {data!.map((cb) => (
              <li key={cb.id} className="flex items-center justify-between gap-2 rounded-md border border-border/40 p-2">
                <div className="min-w-0 flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{cb.caller_name ?? cb.caller_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(cb.scheduled_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                </div>
                {cb.priority && (
                  <Badge variant={cb.priority === 'high' ? 'destructive' : 'secondary'} className="shrink-0">
                    {cb.priority}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
