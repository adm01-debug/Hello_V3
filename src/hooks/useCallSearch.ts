import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('CallSearch');

export interface CallSearchResult {
  id: string;
  call_session_id: string;
  agent_name: string | null;
  duration_seconds: number | null;
  created_at: string;
  snippet: string;
}

export function useCallSearch() {
  const [results, setResults] = useState<CallSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, agentName?: string) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('search-calls', {
        body: { query, agentName, limit: 30 },
      });
      if (fnErr) throw fnErr;
      setResults((data?.results || []) as CallSearchResult[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro na busca';
      log.error(msg, e); setError(msg); setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
