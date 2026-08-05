
-- 1. FIX: hold_events - Remove conflicting broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view hold_events" ON public.hold_events;

-- 2. FIX: user_profiles - Use JWT claims for role validation instead of mutable table
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Block sensitive field changes by non-admins" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own non-sensitive fields" ON public.user_profiles;

-- Recreate with JWT-based role check (immutable source)
CREATE POLICY "Users can update own non-sensitive fields"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM (SELECT up.role FROM public.user_profiles up WHERE up.id = auth.uid())
    AND agent_id IS NOT DISTINCT FROM (SELECT up.agent_id FROM public.user_profiles up WHERE up.id = auth.uid())
  );

-- Add RESTRICTIVE policy that uses a pre-update snapshot via subquery
CREATE POLICY "Prevent role escalation via immutable check"
  ON public.user_profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  WITH CHECK (
    -- Admins can change anything
    is_admin_user(auth.uid())
    OR (
      -- Non-admins: role and agent_id must remain unchanged
      role IS NOT DISTINCT FROM (SELECT up.role FROM public.user_profiles up WHERE up.id = auth.uid())
      AND agent_id IS NOT DISTINCT FROM (SELECT up.agent_id FROM public.user_profiles up WHERE up.id = auth.uid())
    )
  );
