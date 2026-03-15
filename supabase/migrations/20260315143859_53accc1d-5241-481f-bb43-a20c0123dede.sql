-- Tighten INSERT policies that use WITH CHECK (true) to require authentication

-- rate_limit_logs: system inserts via security definer functions, keep as-is for now
-- (these are called from check_rate_limit which is SECURITY DEFINER)

-- geo_access_logs: system inserts - tighten to require auth or service role context
DROP POLICY IF EXISTS "System can insert geo access logs" ON public.geo_access_logs;
CREATE POLICY "Authenticated can insert geo access logs"
ON public.geo_access_logs
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

-- blocked_access_logs: same pattern  
DROP POLICY IF EXISTS "System can insert blocked_access_logs" ON public.blocked_access_logs;
CREATE POLICY "Authenticated can insert blocked_access_logs"
ON public.blocked_access_logs
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

-- rate_limit_alerts: system inserts from check_rate_limit (SECURITY DEFINER)
-- Keep as-is since it's called from DB function context
