
-- Fix critical security: Replace overly permissive RLS policies on sensitive tables

-- 1. login_attempts: Replace "true" ALL policy with proper service-role-only access
DROP POLICY IF EXISTS "Service role can manage login_attempts" ON public.login_attempts;
CREATE POLICY "Admins can view login_attempts" ON public.login_attempts FOR SELECT TO authenticated USING (is_admin_or_supervisor());
-- Insert is handled by SECURITY DEFINER functions (record_failed_login, record_successful_login)
-- No direct insert policy needed since functions bypass RLS

-- 2. account_lockouts: Replace "true" ALL policy  
DROP POLICY IF EXISTS "Service role can manage account_lockouts" ON public.account_lockouts;
CREATE POLICY "Admins can view account_lockouts" ON public.account_lockouts FOR SELECT TO authenticated USING (is_admin_or_supervisor());
-- Managed by SECURITY DEFINER functions (check_login_lockout, record_failed_login)

-- 3. password_reset_tokens: Replace "true" ALL policy
DROP POLICY IF EXISTS "System can manage password_reset_tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Edge functions use service role key to manage tokens

-- 4. email_verification_tokens: Replace "true" ALL policy
DROP POLICY IF EXISTS "System can manage email_verification_tokens" ON public.email_verification_tokens;
CREATE POLICY "Users can view own verification tokens" ON public.email_verification_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. webauthn_challenges: Tighten SELECT and INSERT
DROP POLICY IF EXISTS "Anyone can read challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Anyone can insert challenges" ON public.webauthn_challenges;
CREATE POLICY "Authenticated users can read challenges" ON public.webauthn_challenges FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert challenges" ON public.webauthn_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
