
-- 1. CRITICAL FIX: user_mfa_settings - Restrict DELETE to own records
CREATE POLICY "Users can delete own MFA settings"
  ON public.user_mfa_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. FIX: password_reset_tokens - Deny all updates (tokens are immutable)
CREATE POLICY "Deny update password_reset_tokens"
  ON public.password_reset_tokens
  FOR UPDATE
  TO authenticated
  WITH CHECK (false);

-- 3. FIX: email_verification_tokens - Deny all updates
CREATE POLICY "Deny update email_verification_tokens"
  ON public.email_verification_tokens
  FOR UPDATE
  TO authenticated
  WITH CHECK (false);

-- 4. FIX: webauthn_challenges - Deny all updates (challenges are immutable)
CREATE POLICY "Deny update webauthn_challenges"
  ON public.webauthn_challenges
  FOR UPDATE
  TO authenticated
  WITH CHECK (false);
