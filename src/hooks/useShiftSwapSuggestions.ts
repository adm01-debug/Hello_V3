import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShiftSwapSuggestion {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  from_shift_id: string | null;
  to_shift_id: string | null;
  score: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approved_by: string | null;
  approved_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export function useShiftSwapSuggestions() {
  return useQuery<ShiftSwapSuggestion[]>({
    queryKey: ['shift-swap-suggestions'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('shift_swap_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ShiftSwapSuggestion[];
    },
    staleTime: 60 * 1000,
  });
}

export function useGenerateSwapSuggestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('suggest-shift-swaps', { body: {} });
      if (error) throw error;
      return data as { analyzed_shifts: number; suggestions_created: number };
    },
    onSuccess: (d) => {
      toast.success(`${d.suggestions_created} sugestões geradas`);
      qc.invalidateQueries({ queryKey: ['shift-swap-suggestions'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Falha ao gerar sugestões'),
  });
}

export function useUpdateSwapSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('shift_swap_suggestions')
        .update({ status, approved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.status === 'approved' ? 'Troca aprovada' : 'Troca rejeitada');
      qc.invalidateQueries({ queryKey: ['shift-swap-suggestions'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Falha ao atualizar'),
  });
}
