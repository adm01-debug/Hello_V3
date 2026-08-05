import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  normalizeRingGroupDraft,
  clampInt,
  RING_GROUP_LIMITS,
  type RingGroup,
  type RingGroupDraft,
  type RingGroupMember,
} from '@/lib/ring-group';

const log = logger.create('RingGroups');

const GROUPS_KEY = ['ring-groups'] as const;
const MEMBERS_KEY = ['ring-group-members'] as const;

export interface RingGroupAgentOption {
  id: string;
  name: string;
  extension: string | null;
  status: string | null;
}

/**
 * CRUD de grupos de toque. Todas as mutações passam por
 * `normalizeRingGroupDraft` para que nenhum CHECK constraint seja violado.
 */
export function useRingGroups() {
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: GROUPS_KEY,
    queryFn: async (): Promise<RingGroup[]> => {
      const { data, error } = await supabase
        .from('ring_groups')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RingGroup[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const membersQuery = useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: async (): Promise<RingGroupMember[]> => {
      const { data, error } = await supabase
        .from('ring_group_members')
        .select('id, group_id, agent_id, ring_order, delay_seconds, is_enabled')
        .order('ring_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RingGroupMember[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const agentsQuery = useQuery({
    queryKey: ['ring-group-agents'],
    queryFn: async (): Promise<RingGroupAgentOption[]> => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, extension, status')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RingGroupAgentOption[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    void queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
  }, [queryClient]);

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  const membersByGroup = useMemo(() => {
    const map = new Map<string, RingGroupMember[]>();
    for (const member of members) {
      const list = map.get(member.group_id);
      if (list) list.push(member);
      else map.set(member.group_id, [member]);
    }
    return map;
  }, [members]);

  const createGroup = useMutation({
    mutationFn: async (draft: Partial<RingGroupDraft>) => {
      const payload = normalizeRingGroupDraft(draft);
      const { data, error } = await supabase
        .from('ring_groups')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      toast.success('Grupo de toque criado');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao criar grupo de toque', { error });
      toast.error('Não foi possível criar o grupo');
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, draft }: { id: string; draft: Partial<RingGroupDraft> }) => {
      const payload = normalizeRingGroupDraft(draft);
      const { error } = await supabase.from('ring_groups').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grupo atualizado');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao atualizar grupo de toque', { error });
      toast.error('Não foi possível atualizar o grupo');
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ring_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Grupo removido');
      invalidate();
    },
    onError: (error: unknown) => {
      log.error('Falha ao remover grupo de toque', { error });
      toast.error('Não foi possível remover o grupo');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('ring_groups')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error: unknown) => {
      log.error('Falha ao alterar status do grupo', { error });
      toast.error('Não foi possível alterar o status do grupo');
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ groupId, agentId }: { groupId: string; agentId: string }) => {
      const current = membersByGroup.get(groupId) ?? [];
      const nextOrder = clampInt(
        current.length,
        RING_GROUP_LIMITS.ringOrder.min,
        RING_GROUP_LIMITS.ringOrder.max,
        0,
      );
      const { error } = await supabase.from('ring_group_members').insert({
        group_id: groupId,
        agent_id: agentId,
        ring_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error: unknown) => {
      log.error('Falha ao adicionar participante', { error });
      toast.error('Não foi possível adicionar o agente ao grupo');
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<RingGroupMember, 'ring_order' | 'delay_seconds' | 'is_enabled'>>;
    }) => {
      const payload: Record<string, number | boolean> = {};
      if (patch.ring_order !== undefined) {
        payload.ring_order = clampInt(
          patch.ring_order,
          RING_GROUP_LIMITS.ringOrder.min,
          RING_GROUP_LIMITS.ringOrder.max,
          0,
        );
      }
      if (patch.delay_seconds !== undefined) {
        payload.delay_seconds = clampInt(
          patch.delay_seconds,
          RING_GROUP_LIMITS.memberDelay.min,
          RING_GROUP_LIMITS.memberDelay.max,
          0,
        );
      }
      if (patch.is_enabled !== undefined) payload.is_enabled = patch.is_enabled;
      if (Object.keys(payload).length === 0) return;

      const { error } = await supabase.from('ring_group_members').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error: unknown) => {
      log.error('Falha ao atualizar participante', { error });
      toast.error('Não foi possível atualizar o participante');
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ring_group_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (error: unknown) => {
      log.error('Falha ao remover participante', { error });
      toast.error('Não foi possível remover o participante');
    },
  });

  return {
    groups,
    members,
    membersByGroup,
    agents: agentsQuery.data ?? [],
    isLoading: groupsQuery.isLoading || membersQuery.isLoading,
    isError: groupsQuery.isError || membersQuery.isError,
    refetch: () => {
      void groupsQuery.refetch();
      void membersQuery.refetch();
    },
    createGroup,
    updateGroup,
    deleteGroup,
    toggleActive,
    addMember,
    updateMember,
    removeMember,
  };
}
