import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface SuccessPlan {
  id: string;
  account_id: string;
  title: string;
  objective: string;
  business_outcome: string | null;
  start_date: string;
  target_date: string;
  completed_at: string | null;
  status: string;
  progress_percent: number;
  owner_agent_name: string | null;
  stakeholders: unknown[];
  metadata: Record<string, unknown>;
}

export interface SuccessMilestone {
  id: string;
  success_plan_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  status: string;
  display_order: number;
  assigned_to: string | null;
}

export function useSuccessPlans(accountId?: string) {
  const [plans, setPlans] = useState<SuccessPlan[]>([]);
  const [milestones, setMilestones] = useState<Record<string, SuccessMilestone[]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from('success_plans').select('*').order('target_date', { ascending: true });
      if (accountId) q = q.eq('account_id', accountId);
      const { data: planRows, error } = await q;
      if (error) throw error;
      const list = (planRows ?? []) as unknown as SuccessPlan[];
      setPlans(list);

      if (list.length > 0) {
        const { data: ms } = await supabase
          .from('success_plan_milestones').select('*')
          .in('success_plan_id', list.map((p) => p.id))
          .order('display_order', { ascending: true });
        const grouped: Record<string, SuccessMilestone[]> = {};
        (ms ?? []).forEach((m) => {
          const row = m as unknown as SuccessMilestone;
          (grouped[row.success_plan_id] ||= []).push(row);
        });
        setMilestones(grouped);
      } else {
        setMilestones({});
      }
    } catch (err) {
      logger.error('useSuccessPlans load failed', err);
      toast.error('Falha ao carregar planos de sucesso');
    } finally { setLoading(false); }
  }, [accountId]);

  const createPlan = useCallback(async (payload: Partial<SuccessPlan>) => {
    try {
      const { error } = await supabase.from('success_plans').insert(payload as never);
      if (error) throw error;
      toast.success('Plano criado');
      await load();
    } catch (err) {
      logger.error('create plan failed', err);
      toast.error('Falha ao criar plano');
    }
  }, [load]);

  const toggleMilestone = useCallback(async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('success_plan_milestones')
        .update({
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) throw error;
      await load();
    } catch (err) {
      logger.error('toggle milestone failed', err);
      toast.error('Falha ao atualizar marco');
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return { plans, milestones, loading, refresh: load, createPlan, toggleMilestone };
}
