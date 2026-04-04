
-- 1. FIX CRITICAL: call_alerts - Restrict UPDATE to admins/supervisors only
DROP POLICY IF EXISTS "Authenticated can update call_alerts" ON public.call_alerts;
DROP POLICY IF EXISTS "Users can update call alerts" ON public.call_alerts;

CREATE POLICY "Admins and supervisors can update call_alerts"
  ON public.call_alerts
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_supervisor())
  WITH CHECK (is_admin_or_supervisor());

-- Agents can only mark their own alerts as read
CREATE POLICY "Agents can mark own alerts as read"
  ON public.call_alerts
  FOR UPDATE
  TO authenticated
  USING (
    call_session_id IN (
      SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name()
    )
  )
  WITH CHECK (
    call_session_id IN (
      SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name()
    )
  );

-- 2. FIX: goal_violations - Restrict INSERT to admins/supervisors
DROP POLICY IF EXISTS "Authenticated can insert goal_violations" ON public.goal_violations;
DROP POLICY IF EXISTS "Users can insert goal violations" ON public.goal_violations;

CREATE POLICY "Only admins and supervisors can insert goal_violations"
  ON public.goal_violations
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_supervisor());

-- 3. FIX: hold_events - Restrict SELECT to admins/supervisors and own agent
DROP POLICY IF EXISTS "Authenticated can view hold_events" ON public.hold_events;
DROP POLICY IF EXISTS "Users can view hold events" ON public.hold_events;

CREATE POLICY "Admins supervisors and own agent can view hold_events"
  ON public.hold_events
  FOR SELECT
  TO authenticated
  USING (
    is_admin_or_supervisor()
    OR agent_name = get_user_agent_name()
  );

-- 4. FIX: contact_alerts - Restrict INSERT to admins/supervisors
DROP POLICY IF EXISTS "Authenticated can insert contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Users can insert contact alerts" ON public.contact_alerts;

CREATE POLICY "Only admins and supervisors can insert contact_alerts"
  ON public.contact_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_supervisor());

-- 5. FIX: virtual_fax - Restrict INSERT and validate created_by
DROP POLICY IF EXISTS "Authenticated can insert virtual_fax" ON public.virtual_fax;
DROP POLICY IF EXISTS "Users can create fax" ON public.virtual_fax;

CREATE POLICY "Authenticated users can create own fax records"
  ON public.virtual_fax
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid()::text);
