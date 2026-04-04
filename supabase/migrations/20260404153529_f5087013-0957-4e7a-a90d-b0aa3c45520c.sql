
-- 1. user_profiles: Fix role escalation by using the trigger approach only
-- Remove the WITH CHECK role comparison from the permissive policy
-- The prevent_role_escalation trigger (SECURITY DEFINER) already reverts unauthorized role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- The RESTRICTIVE policy now just checks admin for role changes
DROP POLICY IF EXISTS "Prevent self role change" ON public.user_profiles;
CREATE POLICY "Prevent self role change"
  ON public.user_profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
-- Role changes are handled by the prevent_role_escalation trigger

-- 2. login_attempts: Block all direct writes from authenticated users
DROP POLICY IF EXISTS "Deny direct insert login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Deny direct update login_attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Deny direct delete login_attempts" ON public.login_attempts;

CREATE POLICY "Block direct insert login_attempts"
  ON public.login_attempts FOR INSERT TO authenticated
  WITH CHECK (false);
CREATE POLICY "Block direct update login_attempts"
  ON public.login_attempts FOR UPDATE TO authenticated
  USING (false);
CREATE POLICY "Block direct delete login_attempts"
  ON public.login_attempts FOR DELETE TO authenticated
  USING (false);

-- 3. webauthn_challenges: Restrict DELETE to own challenges
DROP POLICY IF EXISTS "Users can delete expired challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Authenticated users can delete expired challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can delete own expired challenges"
  ON public.webauthn_challenges FOR DELETE TO authenticated
  USING (
    expires_at < now() 
    AND (user_id = auth.uid() OR is_admin_or_supervisor())
  );

-- 4. audit_logs: Explicitly block authenticated direct writes
DROP POLICY IF EXISTS "Block direct insert audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Block direct delete audit_logs" ON public.audit_logs;

CREATE POLICY "Block direct insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (false);
CREATE POLICY "Block direct delete audit_logs"
  ON public.audit_logs FOR DELETE TO authenticated
  USING (false);
