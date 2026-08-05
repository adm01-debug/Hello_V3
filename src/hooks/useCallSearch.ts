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
  highlight_terms?: string[];
}

export interface CallSearchFilters {
  agentName?: string;
  dateFrom?: string;
  dateTo?: string;
  minDurationSeconds?: number;
  momentType?: 'price' | 'competitor' | 'objection' | 'next_step' | string;
}

export function useCallSearch() {
  const [results, setResults] = useState<CallSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    filters: CallSearchFilters = {},
    pagination: { limit?: number; offset?: number } = {},
  ) => {
    if (!query.trim()) { setResults([]); setTotal(0); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('search-calls', {
        body: {
          query,
          ...filters,
          limit: pagination.limit ?? 20,
          offset: pagination.offset ?? 0,
        },
      });
      if (fnErr) throw fnErr;
      setResults((data?.results || []) as CallSearchResult[]);
      setTotal(data?.count ?? 0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro na busca';
      log.error(msg, e); setError(msg); setResults([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, total, loading, error, search };
}
