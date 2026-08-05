import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('TalkRatio');

export interface TalkRatioResult {
  callSessionId: string;
  totalDuration: number;
  agentTalkSeconds: number;
  customerTalkSeconds: number;
  silenceSeconds: number;
  agentTalkRatio: number;
  customerTalkRatio: number;
  silenceRatio: number;
  longestAgentMonologueSeconds: number;
  longestCustomerMonologueSeconds: number;
  interruptions: number;
  benchmark: { idealAgentRatio: [number, number]; status: 'agent_low' | 'agent_high' | 'optimal' };
}

export function useTalkRatio() {
  const [data, setData] = useState<TalkRatioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (
    callSessionId: string,
    segments: Array<{ speaker: string; start: number; end: number }>,
    totalDuration?: number,
  ) => {
    setLoading(true); setError(null);
    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke('analyze-talk-ratio', {
        body: { callSessionId, segments, totalDuration },
      });
      if (fnErr) throw fnErr;
      setData(result as TalkRatioResult);
      return result as TalkRatioResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao analisar talk ratio';
      log.error(msg, e); setError(msg); return null;
    } finally { setLoading(false); }
  }, []);

  return { data, loading, error, analyze };
}
