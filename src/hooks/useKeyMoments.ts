import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';
import type { Database } from '@/integrations/supabase/types';

const log = logger.create('KeyMoments');

type KeyMomentRow = Database['public']['Tables']['call_key_moments']['Row'];

export interface KeyMoment {
  id: string;
  call_session_id: string;
  moment_type: 'price' | 'competitor' | 'objection' | 'next_step' | 'commitment' | 'churn_risk' | 'question' | 'positive';
  timestamp_seconds: number;
  quote: string;
  speaker: string | null;
  confidence: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useKeyMoments(callSessionId?: string) {
  const [moments, setMoments] = useState<KeyMoment[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const fetchMoments = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('call_key_moments')
      .select('*')
      .eq('call_session_id', id)
      .order('timestamp_seconds', { ascending: true });
    if (error) log.error('fetch error', error);
    setMoments(((data as KeyMomentRow[] | null) ?? []) as unknown as KeyMoment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (callSessionId) fetchMoments(callSessionId);
  }, [callSessionId, fetchMoments]);

  const detect = useCallback(async (id: string, transcript: string) => {
    setDetecting(true);
    try {
      return await withTrace('keymoments.detect', async () => {
        const { data, error } = await supabase.functions.invoke('detect-key-moments', {
          body: { callSessionId: id, transcript },
          headers: traceHeaders(),
        });
        if (error) throw error;
        await fetchMoments(id);
        return data;
      });
    } catch (e) {
      log.error('detect error', e);
      return null;
    } finally {
      setDetecting(false);
    }
  }, [fetchMoments]);

  return { moments, loading, detecting, detect, refetch: () => callSessionId && fetchMoments(callSessionId) };
}
