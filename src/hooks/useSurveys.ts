import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface SurveyResponse {
  id: string;
  survey_id: string;
  account_id: string | null;
  contact_id: string | null;
  call_session_id: string | null;
  score: number | null;
  category: string | null;
  answers: Record<string, unknown>;
  free_text_feedback: string | null;
  channel: string;
  submitted_at: string;
}

export function useSurveys(accountId?: string) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('survey_responses').select('*')
        .order('submitted_at', { ascending: false }).limit(200);
      if (accountId) q = q.eq('account_id', accountId);
      const { data, error } = await q;
      if (error) throw error;
      setResponses((data ?? []) as unknown as SurveyResponse[]);
    } catch (err) {
      logger.error('useSurveys load failed', err);
      toast.error('Falha ao carregar respostas');
    } finally { setLoading(false); }
  }, [accountId]);

  const sendSurvey = useCallback(async (payload: {
    survey_id: string; account_id?: string; contact_id?: string;
    call_session_id?: string; channel?: string;
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-survey', { body: payload });
      if (error) throw error;
      toast.success('Pesquisa enviada');
      await load();
    } catch (err) {
      logger.error('send survey failed', err);
      toast.error('Falha ao enviar pesquisa');
    }
  }, [load]);

  const npsScore = useMemo(() => {
    const valid = responses.filter((r) => typeof r.score === 'number');
    if (valid.length === 0) return null;
    const promoters = valid.filter((r) => (r.score ?? 0) >= 9).length;
    const detractors = valid.filter((r) => (r.score ?? 0) <= 6).length;
    return Math.round(((promoters - detractors) / valid.length) * 100);
  }, [responses]);

  useEffect(() => { load(); }, [load]);

  return { responses, loading, refresh: load, sendSurvey, npsScore };
}

export interface SurveyDefinition {
  id: string;
  name: string;
  survey_type: string;
  description: string | null;
  questions: unknown;
  is_active: boolean;
}

const SURVEY_COLUMNS = 'id, name, survey_type, description, questions, is_active';

export function useSurveyDefinitions() {
  const [surveys, setSurveys] = useState<SurveyDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('surveys').select(SURVEY_COLUMNS)
        .eq('is_active', true).order('name');
      if (error) throw error;
      setSurveys((data ?? []) as unknown as SurveyDefinition[]);
    } catch (err) {
      logger.error('useSurveyDefinitions load failed', err);
      toast.error('Falha ao carregar pesquisas');
    } finally { setLoading(false); }
  }, []);

  const createSurvey = useCallback(async (name: string, surveyType = 'nps') => {
    try {
      const { data, error } = await supabase
        .from('surveys').insert({ name, survey_type: surveyType })
        .select(SURVEY_COLUMNS).single();
      if (error) throw error;
      toast.success('Pesquisa criada');
      await load();
      return data as unknown as SurveyDefinition;
    } catch (err) {
      logger.error('create survey failed', err);
      toast.error('Falha ao criar pesquisa');
      return null;
    }
  }, [load]);

  const deactivateSurvey = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('surveys').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      toast.success('Pesquisa desativada');
      await load();
    } catch (err) {
      logger.error('deactivate survey failed', err);
      toast.error('Falha ao desativar pesquisa');
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return { surveys, loading, refresh: load, createSurvey, deactivateSurvey };
}
