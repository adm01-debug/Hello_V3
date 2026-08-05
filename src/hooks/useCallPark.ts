import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  normalizeOrbitDraft,
  firstFreeSlot,
  type CallParkOrbit,
  type CallParkOrbitDraft,
  type ParkedCall,
} from '@/lib/call-park';

const log = logger.create('CallPark');

const ORBITS_KEY = ['call-park-orbits'] as const;
const PARKED_KEY = ['parked-calls'] as const;

export interface ParkCallInput {
  orbitId: string;
  slotNumber: number;
  contactPhone?: string | null;
  contactName?: string | null;
  callSessionId?: string | null;
  notes?: string | null;
}

/**
 * Órbitas de estacionamento + mural de chamadas estacionadas.
 * O mural é volátil por natureza, então usa `staleTime` curto e refetch por
 * intervalo, ao contrário do padrão de 5 min usado nas entidades de cadastro.
 */
export function useCallPark() {
  const queryClient = useQueryClient();

  const orbitsQuery = useQuery({
    queryKey: ORBITS_KEY,
    queryFn: async (): Promise<CallParkOrbit[]> => {
      const { data, error } = await supabase
        .from('call_park_orbits')
        .select('*')
        .order('slot_start', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CallParkOrbit[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const parkedQuery = useQuery({
    queryKey: PARKED_KEY,
    queryFn: async (): Promise<ParkedCall[]> => {
      const { data, error } = await supabase
        .from('parked_calls')
        .select(
          'id, orbit_id, slot_number, call_session_id, contact_phone, contact_name, parked_by, parked_by_name, retrieved_by, retrieved_by_name, status, parked_at, expires_at, retrieved_at, notes',
        )
        .eq('status', 'parked')
        .order('parked_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ParkedCall[];
    },
    staleTime: 5 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: false,
  });

  const orbits = useMemo(() => orbitsQuery.data ?? [], [orbitsQuery.data]);
  const parkedCalls = useMemo(() => parkedQuery.data ?? [], [parkedQuery.data]);

  const invalidateOrbits = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ORBITS_KEY });
  }, [queryClient]);

  const invalidateParked = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PARKED_KEY });
  }, [queryClient]);

  const createOrbit = useMutation({
    mutationFn: async (draft: CallParkOrbitDraft) => {
      const payload = normalizeOrbitDraft(draft);
      const { error } = await supabase.from('call_park_orbits').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Órbita criada com sucesso.');
      invalidateOrbits();
    },
    onError: (error: unknown) => {
      log.error('Falha ao criar órbita', error);
      toast.error(describeError(error, 'Não foi possível criar a órbita.'));
    },
  });

  const updateOrbit = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: CallParkOrbitDraft }) => {
      const payload = normalizeOrbitDraft(draft);
      const { error } = await supabase.from('call_park_orbits').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Órbita atualizada.');
      invalidateOrbits();
    },
    onError: (error: unknown) => {
      log.error('Falha ao atualizar órbita', error);
      toast.error(describeError(error, 'Não foi possível atualizar a órbita.'));
    },
  });

  const deleteOrbit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('call_park_orbits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Órbita removida.');
      invalidateOrbits();
      invalidateParked();
    },
    onError: (error: unknown) => {
      log.error('Falha ao remover órbita', error);
      toast.error(describeError(error, 'Não foi possível remover a órbita.'));
    },
  });

  const parkCall = useMutation({
    mutationFn: async (input: ParkCallInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Sessão expirada. Entre novamente.');

      const orbit = orbits.find((item) => item.id === input.orbitId);
      if (!orbit) throw new Error('Órbita não encontrada.');
      if (!orbit.is_active) throw new Error('Esta órbita está desativada.');

      const expiresAt = new Date(Date.now() + orbit.park_timeout_seconds * 1000).toISOString();
      const displayName =
        (userData.user.user_metadata?.full_name as string | undefined) ??
        userData.user.email ??
        null;

      const { error } = await supabase.from('parked_calls').insert({
        orbit_id: input.orbitId,
        slot_number: input.slotNumber,
        call_session_id: input.callSessionId ?? null,
        contact_phone: input.contactPhone ?? null,
        contact_name: input.contactName ?? null,
        parked_by: userData.user.id,
        parked_by_name: displayName,
        status: 'parked',
        expires_at: expiresAt,
        notes: input.notes ?? null,
      });
      if (error) throw error;
      return input.slotNumber;
    },
    onSuccess: (slot) => {
      toast.success(`Chamada estacionada na vaga ${slot}.`);
      invalidateParked();
    },
    onError: (error: unknown) => {
      log.error('Falha ao estacionar chamada', error);
      toast.error(
        describeError(
          error,
          'Não foi possível estacionar a chamada. A vaga pode ter sido ocupada por outro agente.',
        ),
      );
    },
  });

  const retrieveCall = useMutation({
    mutationFn: async (parkedCallId: string) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Sessão expirada. Entre novamente.');

      const displayName =
        (userData.user.user_metadata?.full_name as string | undefined) ??
        userData.user.email ??
        null;

      // `.eq('status','parked')` evita retirar duas vezes em corrida entre agentes.
      const { data, error } = await supabase
        .from('parked_calls')
        .update({
          status: 'retrieved',
          retrieved_by: userData.user.id,
          retrieved_by_name: displayName,
          retrieved_at: new Date().toISOString(),
        })
        .eq('id', parkedCallId)
        .eq('status', 'parked')
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Esta chamada já foi retirada ou expirou.');
      }
    },
    onSuccess: () => {
      toast.success('Chamada retirada do estacionamento.');
      invalidateParked();
    },
    onError: (error: unknown) => {
      log.error('Falha ao retirar chamada', error);
      toast.error(describeError(error, 'Não foi possível retirar a chamada.'));
    },
  });

  const expireOverdue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('expire_parked_calls');
      if (error) throw error;
      return typeof data === 'number' ? data : 0;
    },
    onSuccess: (count) => {
      if (count > 0) toast.info(`${count} chamada(s) expirada(s) liberada(s).`);
      invalidateParked();
    },
    onError: (error: unknown) => {
      log.error('Falha ao expirar chamadas', error);
      toast.error(describeError(error, 'Não foi possível liberar as vagas vencidas.'));
    },
  });

  const nextFreeSlot = useCallback(
    (orbitId: string): number | null => {
      const orbit = orbits.find((item) => item.id === orbitId);
      if (!orbit) return null;
      return firstFreeSlot(orbit, parkedCalls);
    },
    [orbits, parkedCalls],
  );

  const parkedByOrbit = useMemo(() => {
    const map = new Map<string, ParkedCall[]>();
    for (const call of parkedCalls) {
      const bucket = map.get(call.orbit_id);
      if (bucket) bucket.push(call);
      else map.set(call.orbit_id, [call]);
    }
    return map;
  }, [parkedCalls]);

  return {
    orbits,
    parkedCalls,
    parkedByOrbit,
    isLoading: orbitsQuery.isLoading,
    isError: orbitsQuery.isError || parkedQuery.isError,
    refetch: () => {
      void orbitsQuery.refetch();
      void parkedQuery.refetch();
    },
    createOrbit,
    updateOrbit,
    deleteOrbit,
    parkCall,
    retrieveCall,
    expireOverdue,
    nextFreeSlot,
  };
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}
