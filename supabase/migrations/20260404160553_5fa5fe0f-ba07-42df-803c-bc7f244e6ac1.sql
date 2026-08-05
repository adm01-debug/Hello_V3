
-- Create get_user_agent_id function
CREATE OR REPLACE FUNCTION public.get_user_agent_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id
  FROM public.agents a
  JOIN public.user_profiles up ON up.agent_id = a.id
  WHERE up.id = auth.uid()
  LIMIT 1;
$$;

-- FIX: login_attempts - Add deny INSERT for public role
CREATE POLICY "Deny direct insert login_attempts public"
  ON public.login_attempts
  FOR INSERT
  TO public
  WITH CHECK (false);
