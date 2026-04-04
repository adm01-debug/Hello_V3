
-- FIX: user_profiles - Harden role escalation prevention
DROP POLICY IF EXISTS "Prevent role change by non-admins" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own non-sensitive fields" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;

-- Users can update own profile but NEVER change role or agent_id
CREATE POLICY "Users can update own non-sensitive fields"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = get_profile_role(auth.uid())
    AND (agent_id IS NOT DISTINCT FROM (SELECT agent_id FROM public.user_profiles WHERE id = auth.uid()))
  );

-- Admins can update any profile including role
CREATE POLICY "Admins can update any profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));
