
-- 1. FIX: webauthn_challenges - Add DELETE policy
CREATE POLICY "Users can delete own challenges"
  ON public.webauthn_challenges
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. FIX: video_conferences - Use host_name instead of nonexistent created_by
DROP POLICY IF EXISTS "Agents can view own conferences" ON public.video_conferences;

CREATE POLICY "Agents can view own conferences"
  ON public.video_conferences
  FOR SELECT
  TO authenticated
  USING (
    host_name = get_user_agent_name()
    OR is_admin_or_supervisor()
  );

-- 3. FIX: virtual_fax - Add SELECT for creators
CREATE POLICY "Users can view own fax records"
  ON public.virtual_fax
  FOR SELECT
  TO authenticated
  USING (
    is_admin_or_supervisor()
    OR created_by = auth.uid()::text
  );
