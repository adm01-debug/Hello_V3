import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('ComplianceRules');

export interface ComplianceRule {
  id: string;
  rule_name: string;
  rule_type: string;
  pattern: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  required_disclaimer: string | null;
  category: string | null;
  applies_to: 'agent' | 'customer' | 'both';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useComplianceRules() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['compliance-rules'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('compliance_rules')
        .select('*')
        .order('severity', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ComplianceRule[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (rule: Partial<ComplianceRule> & { rule_name: string; rule_type: string; pattern: string; message: string }) => {
      const { error } = await (supabase as any).from('compliance_rules').upsert(rule);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra salva');
      queryClient.invalidateQueries({ queryKey: ['compliance-rules'] });
    },
    onError: (e: any) => {
      log.error('upsert rule failed', e);
      toast.error(e?.message || 'Falha ao salvar regra');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('compliance_rules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-rules'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('compliance_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra removida');
      queryClient.invalidateQueries({ queryKey: ['compliance-rules'] });
    },
  });

  return {
    rules: list.data ?? [],
    isLoading: list.isLoading,
    upsert: upsert.mutate,
    toggleActive: toggleActive.mutate,
    remove: remove.mutate,
  };
}
