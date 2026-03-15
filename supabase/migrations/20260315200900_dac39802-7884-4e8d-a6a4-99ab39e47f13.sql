
-- Fix RLS: password_reset_requests insert - require authenticated
DROP POLICY "Anyone can request password reset" ON public.password_reset_requests;
CREATE POLICY "Authenticated can request password reset" ON public.password_reset_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix RLS: rate_limit_alerts insert - require authenticated or service role
DROP POLICY "System can insert rate_limit_alerts" ON public.rate_limit_alerts;
CREATE POLICY "Authenticated can insert rate_limit_alerts" ON public.rate_limit_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix RLS: rate_limit_logs insert - require authenticated
DROP POLICY "System can insert rate_limit_logs" ON public.rate_limit_logs;
CREATE POLICY "Authenticated can insert rate_limit_logs" ON public.rate_limit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
