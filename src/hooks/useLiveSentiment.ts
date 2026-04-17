import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type SentimentRow = Database['public']['Tables']['live_sentiment_snapshots']['Row'];
type SentimentInsert = Database['public']['Tables']['live_sentiment_snapshots']['Insert'];

export interface SentimentSnapshot {
  id: string;
  call_session_id: string;
  timestamp_seconds: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number | null;
  urgency: 'low' | 'medium' | 'high' | 'critical' | null;
  emotion: string | null;
  created_at: string;
}

export function useLiveSentiment(callSessionId?: string) {
  const [snapshots, setSnapshots] = useState<SentimentSnapshot[]>([]);

  const recordSnapshot = useCallback(async (snap: Omit<SentimentSnapshot, 'id' | 'created_at'>) => {
    const { error } = await supabase
      .from('live_sentiment_snapshots')
      .insert(snap as SentimentInsert);
    if (!error) setSnapshots(prev => [...prev, { ...snap, id: crypto.randomUUID(), created_at: new Date().toISOString() } as SentimentSnapshot]);
  }, []);

  useEffect(() => {
    if (!callSessionId) return;
    (async () => {
      const { data } = await supabase
        .from('live_sentiment_snapshots')
        .select('*')
        .eq('call_session_id', callSessionId)
        .order('timestamp_seconds', { ascending: true });
      setSnapshots(((data as SentimentRow[] | null) ?? []) as unknown as SentimentSnapshot[]);
    })();

    const channel = supabase
      .channel(`sentiment-${callSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_sentiment_snapshots', filter: `call_session_id=eq.${callSessionId}` },
        (payload) => { setSnapshots(prev => [...prev, payload.new as unknown as SentimentSnapshot]); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [callSessionId]);

  return { snapshots, recordSnapshot };
}
