
-- Tighten journey history insert
DROP POLICY IF EXISTS "Authenticated can insert journey history" ON public.account_journey_history;

CREATE POLICY "Admin/supervisor or CSM insert journey history"
  ON public.account_journey_history FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_journey_history.account_id
        AND a.csm_agent_name = get_user_agent_name()
    )
  );

-- Tighten survey responses insert
DROP POLICY IF EXISTS "Authenticated can insert responses" ON public.survey_responses;

CREATE POLICY "Admin/supervisor or CSM insert survey responses"
  ON public.survey_responses FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_supervisor()
    OR account_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = survey_responses.account_id
        AND a.csm_agent_name = get_user_agent_name()
    )
  );
