
-- 1. CRITICAL: Protect agent_id from being changed by non-admins
DROP POLICY IF EXISTS "Block role change by non-admins" ON public.user_profiles;
CREATE POLICY "Block sensitive field changes by non-admins"
  ON public.user_profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    (role = get_profile_role(auth.uid()) AND agent_id IS NOT DISTINCT FROM get_user_agent_id())
    OR is_admin_user(auth.uid())
  );

-- 2. call_sessions: remove NULL agent bypass
DROP POLICY IF EXISTS "Agents can insert own call sessions" ON public.call_sessions;
DROP POLICY IF EXISTS "Role-based insert call_sessions" ON public.call_sessions;
CREATE POLICY "Agents can insert own call sessions"
  ON public.call_sessions FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name));

-- 3. contact_interactions: remove NULL agent bypass  
DROP POLICY IF EXISTS "Agents can insert own interactions" ON public.contact_interactions;
DROP POLICY IF EXISTS "Validated insert contact_interactions" ON public.contact_interactions;
CREATE POLICY "Agents can insert own interactions"
  ON public.contact_interactions FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor() OR is_active_agent(agent_name));

-- 4. video_conferences: restrict access
DROP POLICY IF EXISTS "Authenticated can view video_conferences" ON public.video_conferences;
DROP POLICY IF EXISTS "Authenticated can insert video_conferences" ON public.video_conferences;
CREATE POLICY "Admins can view video conferences"
  ON public.video_conferences FOR SELECT TO authenticated
  USING (is_admin_or_supervisor());
CREATE POLICY "Admins can insert video conferences"
  ON public.video_conferences FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_supervisor());
