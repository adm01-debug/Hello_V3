-- 1. audit_logs: restrict INSERT to deny direct access (only via log_audit_event RPC)
DROP POLICY IF EXISTS "Authenticated can insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Deny direct insert audit_logs"
ON public.audit_logs FOR INSERT
WITH CHECK (false);

-- 2. consent_history: restrict INSERT to admins/supervisors
DROP POLICY IF EXISTS "Authenticated can insert consent_history" ON public.consent_history;
CREATE POLICY "Admins can insert consent_history"
ON public.consent_history FOR INSERT
WITH CHECK (is_admin_or_supervisor());

-- 3. security_alerts: fix INSERT policy
DROP POLICY IF EXISTS "Admins can insert security_alerts" ON public.security_alerts;
CREATE POLICY "Only admins can insert security_alerts"
ON public.security_alerts FOR INSERT
WITH CHECK (is_admin_or_supervisor());

-- 4. hot_desking_stations: restrict UPDATE
DROP POLICY IF EXISTS "Authenticated can update stations" ON public.hot_desking_stations;
CREATE POLICY "Users can update own station or admins all"
ON public.hot_desking_stations FOR UPDATE
USING (
  is_admin_or_supervisor() 
  OR current_user_name = (SELECT full_name FROM public.user_profiles WHERE id = auth.uid())
);

-- 5. manager_alerts: restrict INSERT
DROP POLICY IF EXISTS "System can insert manager_alerts" ON public.manager_alerts;
CREATE POLICY "Admins can insert manager_alerts"
ON public.manager_alerts FOR INSERT
WITH CHECK (is_admin_or_supervisor());

-- 6. Storage: add UPDATE policy for call-recordings
CREATE POLICY "Admins can update call-recordings"
ON storage.objects FOR UPDATE
USING (bucket_id = 'call-recordings' AND auth.uid() IS NOT NULL AND is_admin_or_supervisor());