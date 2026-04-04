
-- Remove broad webauthn delete policy
DROP POLICY IF EXISTS "Authenticated can delete expired challenges" ON public.webauthn_challenges;

-- Consolidate user_profiles restrictive policies
DROP POLICY IF EXISTS "Prevent self role change" ON public.user_profiles;
DROP POLICY IF EXISTS "Prevent role change by non-admins" ON public.user_profiles;
-- Single restrictive policy: role changes only by admins (trigger is the real guard)
CREATE POLICY "Block role change by non-admins"
  ON public.user_profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    role = get_profile_role(auth.uid())
    OR is_admin_user(auth.uid())
  );
