import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  is_active: boolean;
}

export interface AgentSkill {
  id: string;
  agent_name: string;
  skill_id: string;
  proficiency: number;
  certified_at: string | null;
}

export function useSkills() {
  const qc = useQueryClient();

  const skills = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data, error } = await supabase.from('skills').select('*').order('category, name');
      if (error) throw error;
      return data as Skill[];
    },
  });

  const agentSkills = useQuery({
    queryKey: ['agent_skills'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agent_skills').select('*');
      if (error) throw error;
      return data as AgentSkill[];
    },
  });

  const createSkill = useMutation({
    mutationFn: async (s: Omit<Skill, 'id'>) => {
      const { data, error } = await supabase.from('skills').insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); toast.success('Habilidade criada'); },
    onError: (e) => { logger.error('createSkill', e); toast.error('Erro ao criar habilidade'); },
  });

  const upsertAgentSkill = useMutation({
    mutationFn: async (as: Omit<AgentSkill, 'id' | 'certified_at'> & { certified_at?: string }) => {
      const { data, error } = await supabase
        .from('agent_skills')
        .upsert(as, { onConflict: 'agent_name,skill_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent_skills'] }); toast.success('Habilidade atualizada'); },
    onError: (e) => { logger.error('upsertAgentSkill', e); toast.error('Erro ao atualizar'); },
  });

  return {
    skills: skills.data ?? [],
    agentSkills: agentSkills.data ?? [],
    isLoading: skills.isLoading,
    createSkill: createSkill.mutate,
    upsertAgentSkill: upsertAgentSkill.mutate,
  };
}
