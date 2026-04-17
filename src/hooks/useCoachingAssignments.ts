import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CoachingAssignment {
  id: string;
  agent_name: string;
  assigner_name: string | null;
  call_session_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  due_at: string | null;
  status: string;
  completed_at: string | null;
  agent_response: string | null;
  created_at: string;
}

export function useCoachingAssignments() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['coaching_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaching_assignments')
        .select('*')
        .order('due_at', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as CoachingAssignment[];
    },
  });

  const create = useMutation({
    mutationFn: async (a: Pick<CoachingAssignment, 'agent_name' | 'title' | 'description' | 'priority' | 'due_at' | 'call_session_id'>) => {
      const { data, error } = await supabase.from('coaching_assignments').insert(a).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching_assignments'] }); toast.success('Coaching atribuído'); },
    onError: (e) => { logger.error('createCoachingAssignment', e); toast.error('Erro ao atribuir coaching'); },
  });

  const complete = useMutation({
    mutationFn: async ({ id, agent_response }: { id: string; agent_response?: string }) => {
      const { data, error } = await supabase
        .from('coaching_assignments')
        .update({ status: 'completed', completed_at: new Date().toISOString(), agent_response })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching_assignments'] }); toast.success('Coaching concluído'); },
    onError: (e) => { logger.error('completeCoaching', e); toast.error('Erro ao concluir'); },
  });

  return {
    assignments: list.data ?? [],
    isLoading: list.isLoading,
    create: create.mutate,
    complete: complete.mutate,
  };
}
