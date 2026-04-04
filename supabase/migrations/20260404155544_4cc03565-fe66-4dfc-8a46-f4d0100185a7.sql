
-- 1. FIX: user_profiles - Restrict INSERT to enforce role='agent' for non-admin inserts
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated can insert user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Role-based insert user_profiles" ON public.user_profiles;

CREATE POLICY "Users can insert own profile with agent role"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role = 'agent'
  );

-- Admins can insert profiles with any role
CREATE POLICY "Admins can insert profiles with any role"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user(auth.uid()));

-- 2. FIX: call-recordings storage - Allow agents to upload recordings
DROP POLICY IF EXISTS "Admins can upload recordings" ON storage.objects;

CREATE POLICY "Authenticated users can upload recordings"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'call-recordings');
