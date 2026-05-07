import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';

const log = logger.create('MeetingSummary');

export interface ActionItem {
  description: string;
  owner?: string;
  due_suggestion?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ParticipantSentiment {
  speaker: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
}

export interface MeetingSummary {
  id: string;
  call_session_id: string;
  summary: string | null;
  key_points: string[];
  action_items: ActionItem[];
  decisions: string[];
  next_steps: string[];
  participants_sentiment: ParticipantSentiment[];
  topics_discussed: string[];
  follow_up_required: boolean;
  follow_up_reason: string | null;
  ai_model: string | null;
  ai_confidence: number | null;
  generated_at: string;
  edited: boolean;
   edited_content: Record<string, unknown> | null;
  edited_by: string | null;
  edited_at: string | null;
  shared_with: string[];
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

 const parse = (row: Record<string, any>): MeetingSummary => {
   const base = row as MeetingSummary;
   return {
     ...base,
     key_points: Array.isArray(row.key_points) ? row.key_points : [],
     action_items: Array.isArray(row.action_items) ? row.action_items : [],
     decisions: Array.isArray(row.decisions) ? row.decisions : [],
     next_steps: Array.isArray(row.next_steps) ? row.next_steps : [],
     participants_sentiment: Array.isArray(row.participants_sentiment) ? row.participants_sentiment : [],
     topics_discussed: Array.isArray(row.topics_discussed) ? row.topics_discussed : [],
     shared_with: Array.isArray(row.shared_with) ? row.shared_with : [],
   };
 };

export function useMeetingSummary(callSessionId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['meeting-summary', callSessionId],
    enabled: !!callSessionId,
    queryFn: async () => {
      if (!callSessionId) return null;
      const { data, error } = await supabase
        .from('meeting_summaries')
        .select('*')
        .eq('call_session_id', callSessionId)
        .maybeSingle();
      if (error) throw error;
      return data ? parse(data) : null;
    },
  });

  // Realtime
  useEffect(() => {
    if (!callSessionId) return;
    const channel = supabase
      .channel(`meeting-summary-${callSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_summaries',
          filter: `call_session_id=eq.${callSessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['meeting-summary', callSessionId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [callSessionId, queryClient]);

  const generate = useMutation({
    mutationFn: async (force: boolean = false) => {
      if (!callSessionId) throw new Error('callSessionId ausente');
      const { data, error } = await withTrace('meeting-summary.generate', () =>
        supabase.functions.invoke('generate-meeting-summary', {
          body: { callSessionId, force },
          headers: traceHeaders(),
        }),
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
     onSuccess: (data: { skipped?: boolean } | null) => {
      if (data?.skipped) {
        toast.info('Resumo já existente');
      } else {
        toast.success('Resumo gerado pela IA');
      }
      queryClient.invalidateQueries({ queryKey: ['meeting-summary', callSessionId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-summaries-list'] });
    },
    onError: (err: any) => {
      log.error('generate failed', err);
      toast.error(err?.message || 'Falha ao gerar resumo');
    },
  });

  const updateContent = useMutation({
    mutationFn: async (patch: Partial<MeetingSummary>) => {
      if (!query.data?.id) throw new Error('Resumo inexistente');
      const { error } = await (supabase
        .from('meeting_summaries')
        .update({
          ...patch,
          edited: true,
          edited_at: new Date().toISOString(),
        } as never)
        .eq('id', query.data.id));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resumo atualizado');
      queryClient.invalidateQueries({ queryKey: ['meeting-summary', callSessionId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Falha ao atualizar'),
  });

  const share = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (!query.data?.id) throw new Error('Resumo inexistente');
      const { error } = await supabase
        .from('meeting_summaries')
        .update({ shared_with: userIds })
        .eq('id', query.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Compartilhado');
      queryClient.invalidateQueries({ queryKey: ['meeting-summary', callSessionId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Falha ao compartilhar'),
  });

  return {
    summary: query.data,
    isLoading: query.isLoading,
    isGenerating: generate.isPending || query.data?.status === 'generating',
    generate: (force?: boolean) => generate.mutate(force ?? false),
    updateContent: updateContent.mutate,
    share: share.mutate,
  };
}

export function useMeetingSummariesList(filters?: {
  followUpOnly?: boolean;
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['meeting-summaries-list', filters],
    queryFn: async () => {
      let q = supabase
        .from('meeting_summaries')
        .select('*, call_sessions!inner(caller_name, caller_phone, agent_name, started_at, duration_seconds)')
        .eq('status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(filters?.limit ?? 50);

      if (filters?.followUpOnly) q = q.eq('follow_up_required', true);
      if (filters?.search) q = q.ilike('summary', `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
       return (data ?? []).map((r: Record<string, any>) => ({ ...parse(r), call_sessions: r.call_sessions }));
    },
  });
}

export function usePendingActionItems() {
  return useQuery({
    queryKey: ['pending-action-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_summaries')
        .select('id, call_session_id, action_items, generated_at')
        .eq('status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
       const summaries = (data ?? []) as any[];
       const total = summaries.reduce(
         (sum: number, r: any) => sum + (Array.isArray(r.action_items) ? r.action_items.length : 0),
         0
       );
       const followUps = summaries.filter((r: any) =>
         Array.isArray(r.action_items) && r.action_items.length > 0
       ).length;
      return { total, followUps, recent: data ?? [] };
    },
    staleTime: 60_000,
  });
}

export function useAutoMeetingSummary() {
  const [pending, setPending] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const trigger = useCallback(
    async (callSessionId: string, durationSeconds: number) => {
      if (durationSeconds < 60) return;
      if (pending.has(callSessionId)) return;
      setPending((p) => new Set(p).add(callSessionId));
      try {
        await withTrace('meeting-summary.auto', () =>
          supabase.functions.invoke('generate-meeting-summary', {
            body: { callSessionId },
            headers: traceHeaders(),
          }),
        );
        queryClient.invalidateQueries({ queryKey: ['meeting-summary', callSessionId] });
      } catch (e) {
        log.error('auto summary failed', e);
      } finally {
        setPending((p) => {
          const next = new Set(p);
          next.delete(callSessionId);
          return next;
        });
      }
    },
    [pending, queryClient]
  );

  return { triggerSummary: trigger };
}
