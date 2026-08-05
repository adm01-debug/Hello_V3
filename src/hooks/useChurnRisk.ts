import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface ChurnSignal {
  id: string;
  account_id: string;
  signal_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score_delta: number;
  description: string;
  evidence: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  is_active: boolean;
}

export function useChurnRisk(accountId?: string) {
  const [signals, setSignals] = useState<ChurnSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('churn_risk_signals').select('*')
        .eq('is_active', true)
        .order('detected_at', { ascending: false });
      if (accountId) q = q.eq('account_id', accountId);
      const { data, error } = await q;
      if (error) throw error;
      setSignals((data ?? []) as unknown as ChurnSignal[]);
    } catch (err) {
      logger.error('useChurnRisk load failed', err);
      toast.error('Falha ao carregar sinais de churn');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const resolve = useCallback(async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('churn_risk_signals')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Sinal resolvido');
      await load();
    } catch (err) {
      logger.error('resolve signal failed', err);
      toast.error('Falha ao resolver sinal');
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return { signals, loading, refresh: load, resolve };
}
