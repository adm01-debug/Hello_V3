import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('ObjectionLibrary');

export interface Objection {
  id: string;
  objection_type: string;
  trigger_keywords: string[];
  objection_example: string;
  recommended_response: string;
  talking_points: string[];
  category: string | null;
  difficulty: string;
  success_rate: number;
  times_suggested: number;
  times_used: number;
  times_won: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useObjectionLibrary() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['objection-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objection_library')
        .select('*')
        .order('objection_type', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Objection[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (obj: Partial<Objection> & { objection_type: string; objection_example: string; recommended_response: string }) => {
      const { error } = await supabase.from('objection_library').upsert(obj);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Objeção salva');
      queryClient.invalidateQueries({ queryKey: ['objection-library'] });
    },
    onError: (e: unknown) => {
      log.error('upsert objection failed', e);
      toast.error((e instanceof Error ? e.message : '') || 'Falha ao salvar objeção');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('objection_library').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Objeção removida');
      queryClient.invalidateQueries({ queryKey: ['objection-library'] });
    },
    onError: (e: unknown) => toast.error((e instanceof Error ? e.message : '') || 'Falha ao remover'),
  });

  const recordWin = useMutation({
    mutationFn: async ({ id, won }: { id: string; won: boolean }) => {
      const current = list.data?.find((o) => o.id === id);
      if (!current) return;
      const updates = {
        times_used: current.times_used + 1,
        times_won: current.times_won + (won ? 1 : 0),
        success_rate: Math.round(((current.times_won + (won ? 1 : 0)) / (current.times_used + 1)) * 10000) / 100,
      };
      const { error } = await supabase
        .from('objection_library')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objection-library'] });
    },
  });

  return {
    objections: list.data ?? [],
    isLoading: list.isLoading,
    upsert: upsert.mutate,
    remove: remove.mutate,
    recordWin: recordWin.mutate,
  };
}
