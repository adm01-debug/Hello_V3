-- 1. login_attempts: deny all writes from regular users (handled by SECURITY DEFINER functions)
CREATE POLICY "Deny direct insert login_attempts"
ON public.login_attempts FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct update login_attempts"
ON public.login_attempts FOR UPDATE
USING (false);

CREATE POLICY "Deny direct delete login_attempts"
ON public.login_attempts FOR DELETE
USING (false);

-- 2. email_verification_tokens: restrict INSERT/DELETE
CREATE POLICY "Users can insert own verification tokens"
ON public.email_verification_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own verification tokens"
ON public.email_verification_tokens FOR DELETE
USING (auth.uid() = user_id OR is_admin_user(auth.uid()));

-- 3. password_reset_tokens: restrict INSERT/DELETE
CREATE POLICY "Users can insert own reset tokens"
ON public.password_reset_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reset tokens"
ON public.password_reset_tokens FOR DELETE
USING (auth.uid() = user_id OR is_admin_user(auth.uid()));

-- 4. account_lockouts: deny all writes from regular users
CREATE POLICY "Deny direct insert account_lockouts"
ON public.account_lockouts FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct update account_lockouts"
ON public.account_lockouts FOR UPDATE
USING (false);

CREATE POLICY "Deny direct delete account_lockouts"
ON public.account_lockouts FOR DELETE
USING (false);

-- 5. Storage: allow agents to read their own call recordings
CREATE POLICY "Agents can read own call-recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'call-recordings' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.call_recordings cr
    JOIN public.call_sessions cs ON cs.id = cr.call_session_id
    WHERE cr.file_path = name
      AND cs.agent_name = get_user_agent_name()
  )
);

-- 6. Force role='agent' on new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'agent'
  );
  RETURN NEW;
END;
$$;

-- 7. Remove notifications from realtime (per-user messages)
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;