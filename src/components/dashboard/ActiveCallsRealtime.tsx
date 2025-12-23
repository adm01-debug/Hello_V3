import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Phone, Pause, Clock, User, Filter, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useHoldSoundAlert } from '@/hooks/useHoldSoundAlert';

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
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Sound alert hook
  const { soundEnabled, toggleSound, settings } = useHoldSoundAlert(activeHolds);

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

  // Get hold severity based on duration and settings
  const getHoldSeverity = (holdDuration: number): 'normal' | 'warning' | 'critical' => {
    if (holdDuration >= settings.critical_threshold_seconds) return 'critical';
    if (holdDuration >= settings.warning_threshold_seconds) return 'warning';
    return 'normal';
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

  // Get unique agents from active calls
  const agents = useMemo(() => {
    const agentNames = activeCalls
      .map(call => call.agent_name)
      .filter((name): name is string => !!name);
    return [...new Set(agentNames)].sort();
  }, [activeCalls]);

  // Filter calls by selected agent
  const filteredCalls = useMemo(() => {
    if (selectedAgent === 'all') return activeCalls;
    return activeCalls.filter(call => call.agent_name === selectedAgent);
  }, [activeCalls, selectedAgent]);

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Chamadas Ativas
            {filteredCalls.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredCalls.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSound}
                    className={soundEnabled ? 'text-primary' : 'text-muted-foreground'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{soundEnabled ? 'Desativar som de alerta' : 'Ativar som de alerta'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {agents.length > 0 && (
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os agentes</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{selectedAgent === 'all' ? 'Nenhuma chamada ativa no momento' : `Nenhuma chamada ativa para ${selectedAgent}`}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCalls.map(call => {
              const onHold = isCallOnHold(call.id);
              const holdDuration = getHoldDuration(call.id);
              const holdSeverity = onHold ? getHoldSeverity(holdDuration) : 'normal';
              const callDuration = Math.floor(
                (Date.now() - new Date(call.started_at).getTime()) / 1000
              );

              return (
                <div
                  key={call.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    holdSeverity === 'critical'
                      ? 'border-destructive bg-destructive/10 animate-pulse'
                      : holdSeverity === 'warning'
                      ? 'border-orange-500/50 bg-orange-500/5'
                      : onHold
                      ? 'border-destructive/50 bg-destructive/5 animate-pulse'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          holdSeverity === 'critical'
                            ? 'bg-destructive/20'
                            : holdSeverity === 'warning'
                            ? 'bg-orange-500/20'
                            : onHold
                            ? 'bg-destructive/10'
                            : 'bg-primary/10'
                        }`}
                      >
                        {onHold ? (
                          <Pause className={`h-4 w-4 ${
                            holdSeverity === 'critical'
                              ? 'text-destructive'
                              : holdSeverity === 'warning'
                              ? 'text-orange-500'
                              : 'text-destructive'
                          }`} />
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
                        <Badge 
                          variant="destructive" 
                          className={`${
                            holdSeverity === 'critical'
                              ? 'bg-destructive animate-pulse'
                              : holdSeverity === 'warning'
                              ? 'bg-orange-500 hover:bg-orange-600'
                              : 'animate-pulse'
                          }`}
                        >
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
