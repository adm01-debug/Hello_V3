DROP POLICY IF EXISTS "parked_calls_insert_auth" ON public.parked_calls;
DROP POLICY IF EXISTS "parked_calls_update_auth" ON public.parked_calls;

CREATE POLICY "parked_calls_insert_self" ON public.parked_calls
  FOR INSERT TO authenticated
  WITH CHECK (parked_by = auth.uid() AND status = 'parked');

CREATE POLICY "parked_calls_update_retrieve" ON public.parked_calls
  FOR UPDATE TO authenticated
  USING (status = 'parked' OR public.is_admin_or_supervisor())
  WITH CHECK (
    public.is_admin_or_supervisor()
    OR (status <> 'parked' AND retrieved_by = auth.uid())
    OR (status = 'parked' AND parked_by = auth.uid())
  );