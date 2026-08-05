
-- 1. security_alerts: Align INSERT to admin-only
DROP POLICY IF EXISTS "Admins can insert security alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "System can insert security_alerts" ON public.security_alerts;
DROP POLICY IF EXISTS "Authenticated can insert security_alerts" ON public.security_alerts;
CREATE POLICY "Only admins can insert security alerts"
  ON public.security_alerts FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

-- 2. geo_access_logs: Add admin-only DELETE for cleanup
DROP POLICY IF EXISTS "Admins can delete geo access logs" ON public.geo_access_logs;
CREATE POLICY "Admins can delete geo access logs"
  ON public.geo_access_logs FOR DELETE TO authenticated
  USING (is_admin_or_supervisor());
