import { useCallback, useEffect, useState } from 'react';
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
  created_at: string;
  updated_at: string;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setAccounts((data ?? []) as unknown as Account[]);
    } catch (err) {
      logger.error('useAccounts load failed', err);
      toast.error('Falha ao carregar contas');
    } finally {
      setLoading(false);
    }
  }, []);

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
      const { error } = await supabase
        .from('accounts').update(patch as never).eq('id', id);
      if (error) throw error;
      toast.success('Conta atualizada');
      await load();
    } catch (err) {
      logger.error('update account failed', err);
      toast.error('Falha ao atualizar conta');
    }
  }, [load]);

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

  return { accounts, loading, refresh: load, create, update, recomputeHealth, detectChurn };
}
