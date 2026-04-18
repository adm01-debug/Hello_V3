import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type VoipProvider = 'nvoip' | 'directcall' | 'totalvoice' | 'generic' | 'wavoip';

export interface VoipTrunk {
  id: string;
  name: string;
  provider: VoipProvider;
  sip_server: string;
  sip_username: string;
  sip_realm: string | null;
  transport: 'wss' | 'tcp' | 'udp';
  max_channels: number;
  priority: number;
  is_active: boolean;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface TrunkAssignment {
  id: string;
  agent_id: string;
  trunk_id: string;
  is_primary: boolean;
  version: number;
  agents?: { name: string; extension: string };
  voip_trunks?: { name: string; provider: string };
}

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('voip-trunks-manage', {
    body: { action, ...payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function useVoipTrunks() {
  return useQuery({
    queryKey: ['voip-trunks'],
    queryFn: () => invoke<{ trunks: VoipTrunk[] }>('list').then(r => r.trunks),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrunkAssignments() {
  return useQuery({
    queryKey: ['trunk-assignments'],
    queryFn: () => invoke<{ assignments: TrunkAssignment[] }>('list-assignments').then(r => r.assignments),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveTrunk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<VoipTrunk> & { sip_password?: string }) => {
      const action = payload.id ? 'update' : 'create';
      return invoke<{ trunk: VoipTrunk }>(action, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voip-trunks'] });
      toast.success('Trunk salvo com sucesso');
    },
    onError: (err: Error) => {
      logger.error('Erro ao salvar trunk', err);
      toast.error('Erro ao salvar', { description: err.message });
    },
  });
}

export function useDeleteTrunk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoke('delete', { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voip-trunks'] });
      qc.invalidateQueries({ queryKey: ['trunk-assignments'] });
      toast.success('Trunk removido');
    },
    onError: (err: Error) => toast.error('Erro ao remover', { description: err.message }),
  });
}

export function useTestTrunk() {
  return useMutation({
    mutationFn: (id: string) => invoke<{ reachable: boolean; latency_ms: number; server: string }>('test-registration', { id }),
    onSuccess: (data) => {
      if (data.reachable) {
        toast.success(`Servidor acessível (${data.latency_ms}ms)`, { description: data.server });
      } else {
        toast.error('Servidor inacessível', { description: data.server });
      }
    },
    onError: (err: Error) => toast.error('Falha no teste', { description: err.message }),
  });
}

export function useSaveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { agent_id: string; trunk_id: string; is_primary: boolean }) =>
      invoke('create-assignment', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trunk-assignments'] });
      toast.success('Atribuição criada');
    },
    onError: (err: Error) => toast.error('Erro ao atribuir', { description: err.message }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoke('delete-assignment', { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trunk-assignments'] });
      toast.success('Atribuição removida');
    },
  });
}
