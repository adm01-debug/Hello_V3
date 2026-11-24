import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface Account {
  id: string;
  name: string;
  domain: string | null;
  segment: string;
  mrr: number;
  arr: number;
  contract_start_date: string | null;
  contract_end_date: string | null;
  csm_agent_name: string | null;
  health_score: number;
  health_factors: Record<string, number>;
  churn_risk_score: number;
  current_stage: string;
  status: string;
  last_contact_at: string | null;
  next_review_at: string | null;
  notes: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

const ACCOUNTS_PAGE_SIZE = 50;

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(0);

  // Paginas de 50: sem range() o PostgREST corta em 1000 linhas em silencio e a
  // tela mostra o resultado como se fosse a carteira inteira.
  const fetchPage = useCallback(async (pageToFetch: number) => {
    const from = pageToFetch * ACCOUNTS_PAGE_SIZE;
    try {
      const { data, error, count } = await supabase
        .from('accounts')
        .select('*', pageToFetch === 0 ? { count: 'exact' } : undefined)
        // Desempate por id: sem ordem estavel a paginacao repete/pula linha.
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + ACCOUNTS_PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Account[];
      if (pageToFetch === 0 && typeof count === 'number') setTotalCount(count);
      setHasMore(rows.length === ACCOUNTS_PAGE_SIZE);
      setAccounts((prev) => (pageToFetch === 0 ? rows : [...prev, ...rows]));
    } catch (err) {
      logger.error('useAccounts load failed', err);
      toast.error('Falha ao carregar contas');
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    pageRef.current = 0;
    try {
      await fetchPage(0);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      pageRef.current += 1;
      await fetchPage(pageRef.current);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore]);

  const create = useCallback(async (payload: Partial<Account>) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert(payload as never)
        .select()
        .single();
      if (error) throw error;
      toast.success('Conta criada');
      await load();
      return data as unknown as Account;
    } catch (err) {
      logger.error('create account failed', err);
      toast.error('Falha ao criar conta');
      return null;
    }
  }, [load]);

  const update = useCallback(async (id: string, patch: Partial<Account>) => {
    try {
      // Lock otimista: o gatilho só compara version quando a coluna é enviada.
      const payload: Record<string, unknown> = { ...patch };
      if (payload.version === undefined) {
        const current = accounts.find((a) => a.id === id);
        if (current && typeof current.version === 'number') payload.version = current.version;
      }
      const { error } = await supabase
        .from('accounts').update(payload as never).eq('id', id);
      if (error) {
        if (error.message?.includes('OPTIMISTIC_LOCK_CONFLICT')) {
          toast.error('Esta conta foi alterada por outro usuário. Recarregando...');
          await load();
          return;
        }
        throw error;
      }
      toast.success('Conta atualizada');
      await load();
    } catch (err) {
      logger.error('update account failed', err);
      toast.error('Falha ao atualizar conta');
    }
  }, [accounts, load]);

  const recomputeHealth = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('compute-account-health', {
        body: { account_id: id },
      });
      if (error) throw error;
      toast.success('Health score recalculado');
      await load();
    } catch (err) {
      logger.error('recompute health failed', err);
      toast.error('Falha ao recalcular health');
    }
  }, [load]);

  const detectChurn = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-churn-risk', {
        body: { account_id: id },
      });
      if (error) throw error;
      const detected = (data as { signals_persisted?: number })?.signals_persisted ?? 0;
      toast.success(`Detecção concluída: ${detected} novo(s) sinal(is)`);
      await load();
    } catch (err) {
      logger.error('detect churn failed', err);
      toast.error('Falha ao detectar risco de churn');
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return {
    accounts, loading, totalCount, hasMore, loadingMore, loadMore,
    refresh: load, create, update, recomputeHealth, detectChurn,
  };
}
