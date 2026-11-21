-- Fix A1/A3: remove `USING (true)` policies that neutralized restrictive RLS on production tables.
-- Ground truth: only these 4 "Allow all" policies survive to production (the *_sharpen/security
-- migrations already dropped the permissive policies on token/rate_limit tables).
-- contacts and agents have restrictive replacement policies (view/insert/update/delete scoped to
-- authenticated/admin). call_records and queue_items have NO replacement policy and are unreferenced
-- by any edge/function; to avoid leaving them completely inaccessible we add admin-only policies
-- (RLS stays restrictive, only admins/supervisors can manage them).

DROP POLICY IF EXISTS "Allow all" ON public.contacts;
DROP POLICY IF EXISTS "Allow all" ON public.call_records;
DROP POLICY IF EXISTS "Allow all" ON public.queue_items;
DROP POLICY IF EXISTS "Allow all" ON public.agents;

-- call_records / queue_items: admin-only management (no other policy exists for them)
CREATE POLICY "Admins can manage call_records"
  ON public.call_records FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

CREATE POLICY "Admins can view call_records"
  ON public.call_records FOR SELECT TO authenticated
  USING (public.is_admin_or_supervisor());

CREATE POLICY "Admins can manage queue_items"
  ON public.queue_items FOR ALL TO authenticated
  USING (public.is_admin_or_supervisor())
  WITH CHECK (public.is_admin_or_supervisor());

CREATE POLICY "Admins can view queue_items"
  ON public.queue_items FOR SELECT TO authenticated
  USING (public.is_admin_or_supervisor());
