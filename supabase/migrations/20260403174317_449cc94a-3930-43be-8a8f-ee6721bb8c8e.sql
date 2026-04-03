-- 1. Fix password_reset_tokens INSERT: restrict to authenticated only
DROP POLICY IF EXISTS "Users can insert own reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Authenticated users can insert own reset tokens"
ON public.password_reset_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Fix email_verification_tokens INSERT: restrict to authenticated only
DROP POLICY IF EXISTS "Users can insert own verification tokens" ON public.email_verification_tokens;
CREATE POLICY "Authenticated users can insert own verification tokens"
ON public.email_verification_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Fix webauthn_challenges DELETE: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can delete expired challenges" ON public.webauthn_challenges;
CREATE POLICY "Authenticated can delete expired challenges"
ON public.webauthn_challenges FOR DELETE
TO authenticated
USING (expires_at < now());

-- 4. Add RESTRICTIVE policy on user_profiles to prevent role changes
CREATE POLICY "Prevent role change by non-admins"
ON public.user_profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  role = get_profile_role(auth.uid())
  OR is_admin_user(auth.uid())
);