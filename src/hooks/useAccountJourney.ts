import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface JourneyStage {
  id: string;
  stage_key: string;
  stage_name: string;
  description: string | null;
  display_order: number;
  color: string | null;
  is_active: boolean;
}

export interface JourneyHistoryEntry {
  id: string;
  account_id: string;
  from_stage: string | null;
  to_stage: string;
  reason: string | null;
  triggered_by: string | null;
  created_at: string;
}

export interface StageChangeInput {
  accountId: string;
  accountName: string;
  fromStage: string | null;
  toStageKey: string;
  version?: number;
  reason?: string;
}

const HISTORY_LIMIT = 20;

/**
 * Jornada do cliente: etapas (`customer_journey_stages`) e transições da conta
 * (`account_journey_history`). A troca grava `accounts.current_stage` e, em
 * seguida, o registro de auditoria — a etapa é a fonte de verdade.
 */
export function useAccountJourney() {
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const [stagesError, setStagesError] = useState<string | null>(null);
  const [historyByAccount, setHistoryByAccount] = useState<Record<string, JourneyHistoryEntry[]>>({});
  const [loadingHistoryFor, setLoadingHistoryFor] = useState<string | null>(null);
  const [savingFor, setSavingFor] = useState<string | null>(null);

  const loadStages = useCallback(async () => {
    setLoadingStages(true);
    try {
      const { data, error } = await supabase
        .from('customer_journey_stages')
        .select('id, stage_key, stage_name, description, display_order, color, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      setStages((data ?? []) as unknown as JourneyStage[]);
      setStagesError(null);
    } catch (err) {
      logger.error('useAccountJourney load stages failed', err);
      setStagesError('Nao foi possivel carregar as etapas da jornada');
    } finally {
      setLoadingStages(false);
    }
  }, []);

  const loadHistory = useCallback(async (accountId: string) => {
    setLoadingHistoryFor(accountId);
    try {
      const { data, error } = await supabase
        .from('account_journey_history')
        .select('id, account_id, from_stage, to_stage, reason, triggered_by, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) throw error;
      setHistoryByAccount((prev) => ({
        ...prev,
        [accountId]: (data ?? []) as unknown as JourneyHistoryEntry[],
      }));
    } catch (err) {
      logger.error('useAccountJourney load history failed', err);
      toast.error('Falha ao carregar o historico da jornada');
    } finally {
      setLoadingHistoryFor(null);
    }
  }, []);

  const stageByKey = useMemo(() => {
    const map = new Map<string, JourneyStage>();
    stages.forEach((stage) => map.set(stage.stage_key, stage));
    return map;
  }, [stages]);

  // Etapa sem cadastro ativo continua legivel na tela: mostra a chave crua em vez de vazio.
  const stageLabel = useCallback(
    (key: string | null) => (key ? stageByKey.get(key)?.stage_name ?? key : 'Sem etapa'),
    [stageByKey],
  );

  const changeStage = useCallback(async ({
    accountId, accountName, fromStage, toStageKey, version, reason,
  }: StageChangeInput) => {
    if (!toStageKey || toStageKey === fromStage) return false;
    setSavingFor(accountId);
    try {
      const payload: Record<string, unknown> = { current_stage: toStageKey };
      if (typeof version === 'number') payload.version = version;
      const { error: updateError } = await supabase
        .from('accounts')
        .update(payload as never)
        .eq('id', accountId);
      if (updateError) throw updateError;

      const { data: auth } = await supabase.auth.getUser();
      const { error: historyError } = await supabase
        .from('account_journey_history')
        .insert({
          account_id: accountId,
          from_stage: fromStage ?? null,
          to_stage: toStageKey,
          reason: reason?.trim() ? reason.trim() : null,
          triggered_by: auth?.user?.email ?? 'system',
        } as never);
      if (historyError) {
        logger.error('stage history insert failed', historyError);
        toast.warning('Etapa alterada, mas o historico nao foi registrado');
      } else {
        toast.success(`${accountName}: etapa alterada para ${stageLabel(toStageKey)}`);
      }
      await loadHistory(accountId);
      return true;
    } catch (err) {
      logger.error('change account stage failed', err);
      const message = (err as { message?: string })?.message ?? '';
      if (message.includes('OPTIMISTIC_LOCK_CONFLICT')) {
        toast.error('Esta conta foi alterada por outro usuario. Recarregue antes de salvar.');
      } else {
        toast.error('Falha ao alterar a etapa da conta');
      }
      return false;
    } finally {
      setSavingFor(null);
    }
  }, [loadHistory, stageLabel]);

  useEffect(() => { loadStages(); }, [loadStages]);

  return {
    stages, loadingStages, stagesError, stageLabel,
    historyByAccount, loadingHistoryFor, loadHistory,
    changeStage, savingFor, refreshStages: loadStages,
  };
}