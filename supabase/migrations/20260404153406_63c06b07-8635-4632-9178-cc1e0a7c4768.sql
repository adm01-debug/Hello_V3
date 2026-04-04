
-- 1. Strengthen user_profiles role protection
DROP POLICY IF EXISTS "Prevent role escalation" ON public.user_profiles;
DROP POLICY IF EXISTS "Prevent self role change" ON public.user_profiles;
CREATE POLICY "Prevent self role change"
  ON public.user_profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    role = get_profile_role(auth.uid())
    OR is_admin_user(auth.uid())
  );

-- 2. agent_ring_settings: Ensure supervisors can read
DROP POLICY IF EXISTS "Supervisors can read ring settings" ON public.agent_ring_settings;
DROP POLICY IF EXISTS "Supervisors can read agent ring settings" ON public.agent_ring_settings;
CREATE POLICY "Supervisors can read agent ring settings"
  ON public.agent_ring_settings FOR SELECT TO authenticated
  USING (is_admin_or_supervisor());
