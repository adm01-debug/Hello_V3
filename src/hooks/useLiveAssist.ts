import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

const log = logger.create('LiveAssist');

export interface LiveAssistSignal {
  id: string;
  call_session_id: string;
  agent_name: string | null;
  intent: string;
  confidence: number;
  suggestion: string | null;
  trigger_text: string | null;
  speaker: string | null;
  source: string;
  metadata: Record<string, unknown>;
  was_used: boolean;
  used_at: string | null;
  timestamp_seconds: number;
  created_at: string;
}

const ANALYSIS_THROTTLE_MS = 5000;
const MIN_NEW_WORDS = 30;

interface AnalyzeArgs {
  latestUtterance: string;
  recentContext?: string;
  speaker?: 'agent' | 'customer';
  agentName?: string;
  timestampSeconds?: number;
}

/** Hook do agente: analisa em tempo real e expõe sinais ao vivo. */
export function useLiveAssist(callSessionId?: string) {
  const queryClient = useQueryClient();
  const lastAnalysisAt = useRef<number>(0);
  const lastWordCount = useRef<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const query = useQuery({
    queryKey: ['live-assist-signals', callSessionId],
    enabled: !!callSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_assist_signals')
        .select('*')
        .eq('call_session_id', callSessionId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as LiveAssistSignal[];
    },
  });

  // Realtime: novos sinais aparecem instantaneamente
  useEffect(() => {
    if (!callSessionId) return;
    const channel = supabase
      .channel(`live-assist-${callSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_assist_signals',
          filter: `call_session_id=eq.${callSessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['live-assist-signals', callSessionId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [callSessionId, queryClient]);

  /** Decide se vale a pena chamar a IA agora (throttle). */
  const shouldAnalyze = useCallback((utterance: string) => {
    const now = Date.now();
    const wordCount = utterance.trim().split(/\s+/).length;
    const elapsed = now - lastAnalysisAt.current;
    const newWords = wordCount - lastWordCount.current;
    return elapsed >= ANALYSIS_THROTTLE_MS || newWords >= MIN_NEW_WORDS;
  }, []);

  const analyze = useCallback(
    async (args: AnalyzeArgs) => {
      if (!callSessionId) return;
      if (!shouldAnalyze(args.latestUtterance)) return;
      lastAnalysisAt.current = Date.now();
      lastWordCount.current = args.latestUtterance.trim().split(/\s+/).length;
      setIsAnalyzing(true);
      try {
        await supabase.functions.invoke('analyze-live-utterance', {
          body: { callSessionId, ...args },
        });
      } catch (e) {
        log.error('analyze failed', e);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [callSessionId, shouldAnalyze]
  );

  const markUsed = useCallback(
    async (signalId: string) => {
      try {
        await supabase
          .from('live_assist_signals')
          .update({ was_used: true, used_at: new Date().toISOString() })
          .eq('id', signalId);
        queryClient.invalidateQueries({ queryKey: ['live-assist-signals', callSessionId] });
      } catch (e) {
        log.error('markUsed failed', e);
      }
    },
    [callSessionId, queryClient]
  );

  return {
    signals: query.data ?? [],
    isLoading: query.isLoading,
    isAnalyzing,
    analyze,
    markUsed,
  };
}

/** Histórico cross-call para a página /agent-assist. */
export function useAgentAssistHistory(filters?: {
  agentName?: string;
  intent?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['agent-assist-history', filters],
    queryFn: async () => {
      let q = supabase
        .from('live_assist_signals')
        .select('*, call_sessions!inner(caller_name, started_at, agent_name)')
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 100);
      if (filters?.agentName) q = q.eq('agent_name', filters.agentName);
      if (filters?.intent) q = q.eq('intent', filters.intent);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
