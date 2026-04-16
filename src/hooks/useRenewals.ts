import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface Renewal {
  id: string;
  account_id: string;
  renewal_type: string;
  current_value: number;
  proposed_value: number;
  probability: number;
  status: string;
  due_date: string;
  closed_at: string | null;
  owner_agent_name: string | null;
  notes: string | null;
  loss_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useRenewals() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('renewals').select('*').order('due_date', { ascending: true });
      if (error) throw error;
      setRenewals((data ?? []) as unknown as Renewal[]);
    } catch (err) {
      logger.error('useRenewals load failed', err);
      toast.error('Falha ao carregar renovações');
    } finally { setLoading(false); }
  }, []);

  const upsert = useCallback(async (payload: Partial<Renewal> & { id?: string }) => {
    try {
      const { id, ...rest } = payload;
      const { error } = id
        ? await supabase.from('renewals').update(rest as never).eq('id', id)
        : await supabase.from('renewals').insert(rest as never);
      if (error) throw error;
      toast.success(id ? 'Renovação atualizada' : 'Renovação criada');
      await load();
    } catch (err) {
      logger.error('upsert renewal failed', err);
      toast.error('Falha ao salvar renovação');
    }
  }, [load]);

  const buckets = useMemo(() => {
    const now = Date.now();
    const bucket = (days: number) =>
      renewals.filter((r) => {
        if (r.status !== 'open' && r.status !== 'in_negotiation') return false;
        const due = new Date(r.due_date).getTime();
        const diff = (due - now) / 86400000;
        return diff >= 0 && diff <= days;
      });
    return {
      d30: bucket(30),
      d60: bucket(60).filter((r) => !bucket(30).find((x) => x.id === r.id)),
      d90: bucket(90).filter((r) => !bucket(60).find((x) => x.id === r.id)),
    };
  }, [renewals]);

  const totals = useMemo(() => {
    const sum = (rs: Renewal[]) => rs.reduce((a, r) => a + Number(r.proposed_value || 0), 0);
    const weighted = (rs: Renewal[]) =>
      rs.reduce((a, r) => a + Number(r.proposed_value || 0) * (r.probability / 100), 0);
    return {
      pipeline_value: sum(renewals.filter((r) => r.status === 'open' || r.status === 'in_negotiation')),
      weighted_value: weighted(renewals.filter((r) => r.status === 'open' || r.status === 'in_negotiation')),
      won_value: sum(renewals.filter((r) => r.status === 'won')),
    };
  }, [renewals]);

  useEffect(() => { load(); }, [load]);

  return { renewals, loading, refresh: load, upsert, buckets, totals };
}
