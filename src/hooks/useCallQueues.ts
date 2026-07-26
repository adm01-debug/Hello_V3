import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  normalizeQueueDraft,
  type CallQueue,
  type CallQueueDraft,
} from '@/lib/call-queue';

const log = logger.create('CallQueues');

const QUEUES_KEY = ['call-queues'] as const;
const MEMBERS_KEY = ['call-queue-members'] as const;

export interface CallQueueMember {
  id: string;
  queue_id: string;
  agent_id: string;
  penalty: number;
  is_active: boolean;
}

/**
 * CRUD de filas de atendimento. As mutações passam sempre por
 * `normalizeQueueDraft` para que nenhum CHECK constraint do banco seja violado.
 */
export function useCallQueues() {
  const queryClient = useQueryClient();

  const queuesQuery = useQuery({
    queryKey: QUEUES_KEY,
    queryFn: async (): Promise<CallQueue[]> => {
      const { data, error } = await supabase
        .from('call_queues')
        .select('*')
        .order('priority', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CallQueue[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const membersQuery = useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: async (): Promise<CallQueueMember[]> => {
      const { data, error } = await supabase
        .from('call_queue_members')
        .select('id, queue_id, agent_id, penalty, is_active')
        .order('penalty', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CallQueueMember[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUEUES_KEY });
    void queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
  }, [queryClient]);

  const createQueue = useMutation({
    mutationFn: async (draft: Partial<CallQueueDraft>) => {
      const payload = normalizeQueueDraft(draft);
      const { data, error } = await supabase
        .from('call_queues')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      toast.success('Fila criada com sucesso');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao criar fila', { error });
      toast.error('Não foi possível criar a fila');
    },
  });

  const updateQueue = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: Partial<CallQueueDraft> }) => {
      const payload = normalizeQueueDraft(draft);
      const { error } = await supabase.from('call_queues').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fila atualizada');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao atualizar fila', { error });
      toast.error('Não foi possível atualizar a fila');
    },
  });

  const deleteQueue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('call_queues').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fila removida');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao remover fila', { error });
      toast.error('Não foi possível remover a fila');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('call_queues')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error: unknown) => {
      log.error('Falha ao alterar status da fila', { error });
      toast.error('Não foi possível alterar o status da fila');
    },
  });

  const memberCountByQueue = (membersQuery.data ?? []).reduce<Record<string, number>>(
    (acc, member) => {
      if (!member.is_active) return acc;
      acc[member.queue_id] = (acc[member.queue_id] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return {
    queues: queuesQuery.data ?? [],
    members: membersQuery.data ?? [],
    memberCountByQueue,
    isLoading: queuesQuery.isLoading,
    isError: queuesQuery.isError,
    refetch: queuesQuery.refetch,
    createQueue,
    updateQueue,
    deleteQueue,
    toggleActive,
  };
}
