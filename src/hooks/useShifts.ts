import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface AgentShift {
  id: string;
  agent_name: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  template_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  days_of_week: number[];
  color: string | null;
  is_active: boolean;
}

export function useShifts(weekStart?: string) {
  const qc = useQueryClient();

  const shiftsQuery = useQuery({
    queryKey: ['agent_shifts', weekStart],
    queryFn: async () => {
      let q = supabase.from('agent_shifts').select('*').order('start_time');
      if (weekStart) {
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 7);
        q = q.gte('shift_date', weekStart).lt('shift_date', end.toISOString().split('T')[0]);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as AgentShift[];
    },
  });

  const templatesQuery = useQuery({
    queryKey: ['shift_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shift_templates').select('*').eq('is_active', true);
      if (error) throw error;
      return data as ShiftTemplate[];
    },
  });

  const createShift = useMutation({
    mutationFn: async (shift: Omit<AgentShift, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('agent_shifts').insert(shift).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent_shifts'] });
      toast.success('Turno criado');
    },
    onError: (e) => { logger.error('createShift', e); toast.error('Erro ao criar turno'); },
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AgentShift> & { id: string }) => {
      const { data, error } = await supabase.from('agent_shifts').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent_shifts'] });
      toast.success('Turno atualizado');
    },
    onError: (e) => { logger.error('updateShift', e); toast.error('Erro ao atualizar turno'); },
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agent_shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent_shifts'] });
      toast.success('Turno removido');
    },
    onError: (e) => { logger.error('deleteShift', e); toast.error('Erro ao remover turno'); },
  });

  return {
    shifts: shiftsQuery.data ?? [],
    templates: templatesQuery.data ?? [],
    isLoading: shiftsQuery.isLoading || templatesQuery.isLoading,
    createShift: createShift.mutate,
    updateShift: updateShift.mutate,
    deleteShift: deleteShift.mutate,
  };
}
