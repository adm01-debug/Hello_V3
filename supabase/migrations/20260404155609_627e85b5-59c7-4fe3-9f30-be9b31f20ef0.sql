
-- FIX: call-recordings - Require agent/admin/supervisor role for uploads
DROP POLICY IF EXISTS "Authenticated users can upload recordings" ON storage.objects;

CREATE POLICY "Agents admins supervisors can upload recordings"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'call-recordings'
    AND (
      is_admin_or_supervisor()
      OR get_user_agent_name() IS NOT NULL
    )
  );
