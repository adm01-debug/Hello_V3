import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import {
  buildLampBoard,
  filterLamps,
  sortLamps,
  summarizeLamps,
  type BlfAgentRow,
  type BlfLamp,
  type BlfParkedRow,
  type BlfSessionRow,
  type LampState,
} from '@/lib/blf';

interface ParkedRawRow {
  id: string;
  slot_number: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  parked_at: string | null;
  status: string | null;
  parked_by_agent_name: string | null;
}

async function fetchBoard(): Promise<{
  agents: BlfAgentRow[];
  sessions: BlfSessionRow[];
  parked: BlfParkedRow[];
}> {
  const [agentsRes, sessionsRes, parkedRes] = await Promise.all([
    supabase.from('agents').select('id,name,extension,status,department,avatar_url'),
    supabase
      .from('call_sessions')
      .select('id,agent_name,caller_name,caller_phone,status,direction,started_at')
      .in('status', ['active', 'ringing', 'on_hold']),
    supabase
      .from('parked_calls')
      .select('id,slot_number,contact_name,contact_phone,parked_at,status,parked_by_agent_name')
      .eq('status', 'parked'),
  ]);

  if (agentsRes.error) throw agentsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  if (parkedRes.error) {
    logger.warn('blf: falha ao carregar chamadas estacionadas', { error: parkedRes.error.message });
  }

  const parked: BlfParkedRow[] = ((parkedRes.data ?? []) as ParkedRawRow[]).map((row) => ({
    id: row.id,
    slot_number: row.slot_number,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    parked_at: row.parked_at,
    status: row.status,
    parked_by_name: row.parked_by_agent_name,
  }));

  return {
    agents: (agentsRes.data ?? []) as BlfAgentRow[],
    sessions: (sessionsRes.data ?? []) as BlfSessionRow[],
    parked,
  };
}

export function useBlfBoard() {
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<LampState | 'all'>('all');
  const [tick, setTick] = useState(0);

  const query = useQuery({
    queryKey: ['blf-board'],
    queryFn: fetchBoard,
    staleTime: 5_000,
    refetchInterval: isVisible ? 15_000 : false,
  });

  // Realtime: qualquer mudança nas três fontes invalida o mural.
  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['blf-board'] });
    };
    const channel = supabase
      .channel('blf-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parked_calls' }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Cronômetro local: evita refetch só para atualizar contadores.
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => setTick((t) => (t + 1) % 3600), 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const lamps: BlfLamp[] = useMemo(() => {
    const data = query.data;
    if (!data) return [];
    void tick;
    return sortLamps(buildLampBoard(data.agents, data.sessions, data.parked, Date.now()));
  }, [query.data, tick]);

  const visibleLamps = useMemo(
    () => filterLamps(lamps, search, stateFilter),
    [lamps, search, stateFilter],
  );

  const summary = useMemo(() => summarizeLamps(lamps), [lamps]);

  return {
    lamps: visibleLamps,
    summary,
    search,
    setSearch,
    stateFilter,
    setStateFilter,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
