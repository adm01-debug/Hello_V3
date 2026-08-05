
-- 1. FIX: virtual_fax - Remove overly permissive INSERT
DROP POLICY IF EXISTS "Authenticated can insert fax" ON public.virtual_fax;
DROP POLICY IF EXISTS "Authenticated users can insert fax" ON public.virtual_fax;
DROP POLICY IF EXISTS "Role-based insert virtual_fax" ON public.virtual_fax;

-- 2. FIX: contact_alerts - Remove overly permissive INSERT
DROP POLICY IF EXISTS "Role-based insert contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Authenticated can insert contact_alerts" ON public.contact_alerts;
DROP POLICY IF EXISTS "Authenticated users can insert contact_alerts" ON public.contact_alerts;

-- 3. FIX: goal_violations - Remove overly permissive INSERT
DROP POLICY IF EXISTS "Authenticated users can insert goal_violations" ON public.goal_violations;
DROP POLICY IF EXISTS "Authenticated can insert goal_violations" ON public.goal_violations;
DROP POLICY IF EXISTS "Role-based insert goal_violations" ON public.goal_violations;

-- 4. FIX: webauthn_challenges - Ensure user_id NOT NULL in INSERT policy
DROP POLICY IF EXISTS "Users can insert own challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Authenticated can insert webauthn_challenges" ON public.webauthn_challenges;
DROP POLICY IF EXISTS "Role-based insert webauthn_challenges" ON public.webauthn_challenges;

CREATE POLICY "Users can insert own challenges"
  ON public.webauthn_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
