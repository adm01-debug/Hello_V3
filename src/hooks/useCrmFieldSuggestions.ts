import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('CrmFieldSuggestions');

export interface CrmFieldSuggestion {
  id: string;
  call_session_id: string;
  contact_id: string | null;
  field_name: string;
  current_value: string | null;
  suggested_value: string;
  confidence: number;
  source_quote: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  reviewed_by: string | null;
  reviewed_at: string | null;
  applied_value: string | null;
  created_at: string;
  updated_at: string;
}

export function useCrmFieldSuggestions(callSessionId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['crm-suggestions', callSessionId],
    enabled: !!callSessionId,
    queryFn: async () => {
      if (!callSessionId) return [] as CrmFieldSuggestion[];
      const { data, error } = await supabase
        .from('crm_field_suggestions')
        .select('*')
        .eq('call_session_id', callSessionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CrmFieldSuggestion[];
    },
  });

  useEffect(() => {
    if (!callSessionId) return;
    const channel = supabase
      .channel(`crm-suggestions-${callSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_field_suggestions',
          filter: `call_session_id=eq.${callSessionId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ['crm-suggestions', callSessionId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [callSessionId, queryClient]);

  const accept = useMutation({
    mutationFn: async ({ id, contactId, field, value }: { id: string; contactId: string | null; field: string; value: string }) => {
      // Aplica no contato (se disponível) e marca como aceita
      if (contactId) {
        const allowed = ['position', 'company', 'notes', 'name', 'email'];
        if (allowed.includes(field)) {
          const { error: contactErr } = await supabase
            .from('contacts')
            .update({ [field]: value })
            .eq('id', contactId);
          if (contactErr) throw contactErr;
        }
      }
      const { error } = await supabase
        .from('crm_field_suggestions')
        .update({
          status: 'accepted',
          applied_value: value,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Sugestão aplicada ao contato');
      queryClient.invalidateQueries({ queryKey: ['crm-suggestions', callSessionId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (e: unknown) => {
      log.error('accept suggestion failed', e);
      toast.error((e instanceof Error ? e.message : '') || 'Falha ao aplicar sugestão');
    },
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_field_suggestions')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-suggestions', callSessionId] });
    },
  });

  const triggerExtraction = useMutation({
    mutationFn: async ({ transcript, contactId }: { transcript: string; contactId?: string | null }) => {
      if (!callSessionId) throw new Error('callSessionId ausente');
      const { data, error } = await supabase.functions.invoke('extract-crm-fields', {
        body: { callSessionId, transcript, contactId: contactId ?? null },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { inserted?: number } | null | undefined) => {
      const n = data?.inserted ?? 0;
      if (n > 0) toast.success(`${n} sugestão(ões) de CRM disponíveis`);
      queryClient.invalidateQueries({ queryKey: ['crm-suggestions', callSessionId] });
    },
    onError: (e: unknown) => {
      log.error('extract failed', e);
    },
  });

  return {
    suggestions: query.data ?? [],
    pending: (query.data ?? []).filter((s) => s.status === 'pending'),
    isLoading: query.isLoading,
    accept: accept.mutate,
    reject: reject.mutate,
    triggerExtraction: triggerExtraction.mutate,
  };
}
