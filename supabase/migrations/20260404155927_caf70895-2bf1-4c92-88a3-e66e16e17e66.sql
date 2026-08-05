
-- 1. FIX: webauthn_challenges - Ensure user_id NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webauthn_challenges' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.webauthn_challenges ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- 2. FIX: call-recordings storage - Fix policy from public to authenticated role
DROP POLICY IF EXISTS "Authenticated admins can upload call-recordings" ON storage.objects;

CREATE POLICY "Authenticated admins can upload call-recordings"
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
