
-- ============================================================
-- ONDA 23 — Security Hardening (P0) — parte 3 (final)
-- Endurece todas as policies "always-true-ish" residuais.
-- ============================================================

-- 1) barge_in_sessions SELECT — só admin/supervisor envolvido ou agente envolvido
DROP POLICY IF EXISTS "Authenticated users can view barge_in_sessions" ON public.barge_in_sessions;
DROP POLICY IF EXISTS "Users can view barge_in_sessions" ON public.barge_in_sessions;
CREATE POLICY "Involved parties view barge_in_sessions"
ON public.barge_in_sessions
FOR SELECT
TO authenticated
USING (
  is_admin_or_supervisor()
  OR supervisor_name = get_user_agent_name()
  OR agent_name = get_user_agent_name()
);

-- 2) kb_article_views SELECT — agente vê os próprios
CREATE POLICY "Agents view own kb_article_views"
ON public.kb_article_views
FOR SELECT
TO authenticated
USING (viewer_id = auth.uid());

-- 3) survey_responses INSERT — exigir ownership/admin (eliminar permissivo)
DROP POLICY IF EXISTS "Authenticated insert survey_responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Users can insert survey_responses" ON public.survey_responses;
CREATE POLICY "Admin or CSM insert survey_responses"
ON public.survey_responses
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_supervisor()
  OR (
    account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = survey_responses.account_id
        AND a.csm_agent_name = get_user_agent_name()
    )
  )
);

-- 4) call_alerts INSERT — exigir admin/supervisor (alertas vêm da IA via service_role)
DROP POLICY IF EXISTS "Authenticated users can insert call_alerts" ON public.call_alerts;
CREATE POLICY "Admin supervisor insert call_alerts"
ON public.call_alerts
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_supervisor());

-- 5) call_key_moments INSERT — owner ou admin
DROP POLICY IF EXISTS "Authenticated insert key moments" ON public.call_key_moments;
CREATE POLICY "Owner or admin insert key moments"
ON public.call_key_moments
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = call_key_moments.call_session_id
      AND cs.agent_name = get_user_agent_name()
  )
);

-- 6) call_transcripts_searchable INSERT/UPDATE — owner ou admin
DROP POLICY IF EXISTS "Authenticated insert transcripts" ON public.call_transcripts_searchable;
DROP POLICY IF EXISTS "Authenticated update transcripts" ON public.call_transcripts_searchable;
CREATE POLICY "Owner or admin insert transcripts"
ON public.call_transcripts_searchable
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = call_transcripts_searchable.call_session_id
      AND cs.agent_name = get_user_agent_name()
  )
);
CREATE POLICY "Owner or admin update transcripts"
ON public.call_transcripts_searchable
FOR UPDATE
TO authenticated
USING (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = call_transcripts_searchable.call_session_id
      AND cs.agent_name = get_user_agent_name()
  )
);

-- 7) coaching_timestamps INSERT — admin/supervisor (coaching é supervisado)
DROP POLICY IF EXISTS "Authenticated insert coaching ts" ON public.coaching_timestamps;
CREATE POLICY "Admin supervisor insert coaching ts"
ON public.coaching_timestamps
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_supervisor());

-- 8) live_assist_signals INSERT — admin/supervisor (sinais vêm de IA via service_role)
DROP POLICY IF EXISTS "Sistema/usuários autenticados podem inserir sinais" ON public.live_assist_signals;
CREATE POLICY "Admin supervisor insert live_assist_signals"
ON public.live_assist_signals
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_supervisor());

-- 9) live_sentiment_snapshots INSERT — owner ou admin
DROP POLICY IF EXISTS "Authenticated insert sentiment snapshots" ON public.live_sentiment_snapshots;
CREATE POLICY "Owner or admin insert sentiment snapshots"
ON public.live_sentiment_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = live_sentiment_snapshots.call_session_id
      AND cs.agent_name = get_user_agent_name()
  )
);

COMMENT ON POLICY "Involved parties view barge_in_sessions" ON public.barge_in_sessions IS 'ADR-038: visibilidade restrita às partes envolvidas na sessão.';
COMMENT ON POLICY "Admin or CSM insert survey_responses" ON public.survey_responses IS 'ADR-038: respostas requerem account_id + ownership do CSM ou papel admin/supervisor.';
