
-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Admins podem gerenciar perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins supervisors view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.user_profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.user_profiles;

-- Create a SECURITY DEFINER helper to check admin role without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = _user_id AND role = 'admin'
  )
$$;

-- Create a SECURITY DEFINER helper to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_profile_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = _user_id
$$;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Admins and supervisors can view all profiles
CREATE POLICY "Admins supervisors view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_or_supervisor());

-- Policy 3: Users can update their own profile (but not change role)
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = public.get_profile_role(auth.uid())
);

-- Policy 4: Admins can manage all profiles (insert, update, delete)
CREATE POLICY "Admins manage all profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()));
