
-- virtual_fax: restrict to admin/supervisor
DROP POLICY IF EXISTS "Authenticated can view fax" ON public.virtual_fax;
CREATE POLICY "Admins can view fax"
  ON public.virtual_fax FOR SELECT TO authenticated
  USING (is_admin_or_supervisor());

-- call_flows: restrict to admin/supervisor
DROP POLICY IF EXISTS "Authenticated can view call_flows" ON public.call_flows;
CREATE POLICY "Admins can view call flows"
  ON public.call_flows FOR SELECT TO authenticated
  USING (is_admin_or_supervisor());

-- toll_free_numbers: restrict to admin/supervisor
DROP POLICY IF EXISTS "Authenticated can view toll_free" ON public.toll_free_numbers;
CREATE POLICY "Admins can view toll free numbers"
  ON public.toll_free_numbers FOR SELECT TO authenticated
  USING (is_admin_or_supervisor());

-- topic_detections: scope to own calls or admin
DROP POLICY IF EXISTS "Authenticated can view topics" ON public.topic_detections;
CREATE POLICY "Scoped view topic detections"
  ON public.topic_detections FOR SELECT TO authenticated
  USING (
    is_admin_or_supervisor()
    OR EXISTS (
      SELECT 1 FROM public.call_sessions cs
      WHERE cs.id = call_session_id
        AND cs.agent_name = get_user_agent_name()
    )
  );
