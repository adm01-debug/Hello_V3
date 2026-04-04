
-- FIX: video_conferences - Allow agents to see conferences where they're host or participant
CREATE POLICY "Agents can view own conferences"
  ON public.video_conferences
  FOR SELECT
  TO authenticated
  USING (
    host_name = get_user_agent_name()
    OR participants::text LIKE '%' || get_user_agent_name() || '%'
    OR is_admin_or_supervisor()
  );
