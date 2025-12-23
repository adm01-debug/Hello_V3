import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Pause, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActiveCall {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  started_at: string;
  status: string | null;
  hold_time_seconds: number | null;
  hold_count: number | null;
}

interface ActiveHoldEvent {
  id: string;
  call_session_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export const ActiveCallsRealtime = () => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [activeHolds, setActiveHolds] = useState<ActiveHoldEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveCalls = async () => {
    const { data, error } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (!error && data) {
      setActiveCalls(data);
    }
  };

  const fetchActiveHolds = async () => {
    const { data, error } = await supabase
      .from('hold_events')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false });

    if (!error && data) {
      setActiveHolds(data);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchActiveCalls(), fetchActiveHolds()]);
      setLoading(false);
    };

    loadData();

    // Subscribe to real-time updates
    const callsChannel = supabase
      .channel('active-calls-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions'
        },
        () => {
          fetchActiveCalls();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hold_events'
        },
        () => {
          fetchActiveHolds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
    };
  }, []);

  const isCallOnHold = (callId: string) => {
    return activeHolds.some(hold => hold.call_session_id === callId);
  };

  const getHoldDuration = (callId: string) => {
    const hold = activeHolds.find(h => h.call_session_id === callId);
    if (!hold) return 0;
    
    const startTime = new Date(hold.started_at).getTime();
    const now = Date.now();
    return Math.floor((now - startTime) / 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-update hold durations
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Chamadas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Chamadas Ativas
          {activeCalls.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeCalls.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma chamada ativa no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCalls.map(call => {
              const onHold = isCallOnHold(call.id);
              const holdDuration = getHoldDuration(call.id);
              const callDuration = Math.floor(
                (Date.now() - new Date(call.started_at).getTime()) / 1000
              );

              return (
                <div
                  key={call.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    onHold
                      ? 'border-destructive/50 bg-destructive/5 animate-pulse'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          onHold ? 'bg-destructive/10' : 'bg-primary/10'
                        }`}
                      >
                        {onHold ? (
                          <Pause className="h-4 w-4 text-destructive" />
                        ) : (
                          <Phone className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {call.caller_name || call.caller_phone || 'Desconhecido'}
                        </p>
                        {call.caller_phone && call.caller_name && (
                          <p className="text-sm text-muted-foreground">
                            {call.caller_phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {onHold ? (
                        <Badge variant="destructive" className="animate-pulse">
                          <Pause className="h-3 w-3 mr-1" />
                          Em Espera {formatDuration(holdDuration)}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <Phone className="h-3 w-3 mr-1" />
                          Em Chamada
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(callDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    {call.agent_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {call.agent_name}
                      </span>
                    )}
                    {(call.hold_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Pause className="h-3 w-3" />
                        {call.hold_count}x em espera
                      </span>
                    )}
                    {(call.hold_time_seconds ?? 0) > 0 && (
                      <span>
                        Total espera: {formatDuration(call.hold_time_seconds ?? 0)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
