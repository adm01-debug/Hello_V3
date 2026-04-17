import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface LearningModule {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  content_body: string | null;
  duration_minutes: number;
  category: string;
  difficulty: string;
  tags: string[] | null;
  is_active: boolean;
}

export interface LearningCompletion {
  id: string;
  agent_name: string;
  module_id: string;
  completed_at: string;
  score: number | null;
}

export function useLearning() {
  const qc = useQueryClient();

  const modules = useQuery({
    queryKey: ['learning_modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_active', true)
        .order('category, title');
      if (error) throw error;
      return data as LearningModule[];
    },
  });

  const completions = useQuery({
    queryKey: ['learning_completions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('learning_completions').select('*');
      if (error) throw error;
      return data as LearningCompletion[];
    },
  });

  const markComplete = useMutation({
    mutationFn: async ({ agent_name, module_id, score }: { agent_name: string; module_id: string; score?: number }) => {
      const { data, error } = await supabase
        .from('learning_completions')
        .upsert({ agent_name, module_id, score }, { onConflict: 'agent_name,module_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['learning_completions'] }); toast.success('Módulo concluído!'); },
    onError: (e) => { logger.error('markComplete', e); toast.error('Erro ao registrar conclusão'); },
  });

  return {
    modules: modules.data ?? [],
    completions: completions.data ?? [],
    isLoading: modules.isLoading,
    markComplete: markComplete.mutate,
  };
}
