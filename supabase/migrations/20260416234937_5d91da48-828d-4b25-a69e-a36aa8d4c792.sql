
DROP POLICY IF EXISTS "Authenticated create deals" ON public.deals;
CREATE POLICY "Authenticated create deals" ON public.deals
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_admin_or_supervisor()
      OR owner_agent_name IS NULL
      OR owner_agent_name = get_user_agent_name()
    )
  );

DROP POLICY IF EXISTS "Authenticated insert enrollments" ON public.cadence_enrollments;
CREATE POLICY "Authenticated insert enrollments" ON public.cadence_enrollments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (is_admin_or_supervisor() OR agent_name = get_user_agent_name())
  );

DROP POLICY IF EXISTS "System inserts matches" ON public.tracker_matches;
CREATE POLICY "Supervisors insert matches" ON public.tracker_matches
  FOR INSERT WITH CHECK (is_admin_or_supervisor());
