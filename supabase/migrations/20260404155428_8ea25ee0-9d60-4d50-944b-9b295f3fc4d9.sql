
-- 1. FIX: call_alerts - Remove broad SELECT and UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can view call_alerts" ON public.call_alerts;
DROP POLICY IF EXISTS "Authenticated users can update call_alerts" ON public.call_alerts;

-- Scoped SELECT: admins/supervisors see all, agents see only their own
CREATE POLICY "Scoped call_alerts SELECT"
  ON public.call_alerts
  FOR SELECT
  TO authenticated
  USING (
    is_admin_or_supervisor()
    OR call_session_id IN (
      SELECT id FROM public.call_sessions WHERE agent_name = get_user_agent_name()
    )
  );

-- 2. FIX: security_alerts - Consolidate duplicate INSERT policies
DROP POLICY IF EXISTS "Only admins can insert security alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Only admins can insert security_alerts" ON public.security_alerts;

CREATE POLICY "Only admins can insert security_alerts"
  ON public.security_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'admin');
