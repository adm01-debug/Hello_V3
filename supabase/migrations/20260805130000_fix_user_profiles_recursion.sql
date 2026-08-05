-- Fix: infinite recursion in user_profiles RLS UPDATE policies
-- Cause: WITH CHECK clauses ran a SELECT on user_profiles inside the same table's
-- policy evaluation, causing Postgres to detect a cycle and reject the UPDATE.
-- Fix: rely on SECURITY DEFINER helpers (is_admin_user, get_profile_role) and the
-- prevent_role_escalation trigger for sensitive field protection, instead of
-- self-referencing subqueries inside WITH CHECK.

-- Drop the recursive UPDATE policies on user_profiles
DROP POLICY IF EXISTS "Users can update own non-sensitive fields" ON public.user_profiles;
DROP POLICY IF EXISTS "Prevent role escalation via immutable check" ON public.user_profiles;
DROP POLICY IF EXISTS "Block sensitive field changes by non-admins" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Prevent self role change" ON public.user_profiles;
DROP POLICY IF EXISTS "Prevent role change by non-admins" ON public.user_profiles;

-- Recreate cleanly. USING/WITH CHECK both use is_admin_user() (SECURITY DEFINER)
-- so they don't trigger RLS on user_profiles from within the policy.
-- Defense-in-depth: prevent_role_escalation() trigger still reverts any role
-- change made by non-admins, even if policy is bypassed via service role.

CREATE POLICY "Users update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins update any profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Make sure the trigger that actually reverts unauthorized role/agent_id changes
-- is still attached. CREATE OR REPLACE TRIGGER isn't a thing in Postgres, but
-- the original trigger is idempotent (DROP IF EXISTS + CREATE) thanks to the
-- earlier migration; we just confirm it here.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'prevent_role_escalation_trigger'
      AND tgrelid = 'public.user_profiles'::regclass
  ) THEN
    CREATE TRIGGER prevent_role_escalation_trigger
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.prevent_role_escalation();
  END IF;
END
$$;
