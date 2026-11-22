-- parked_calls_select_auth expunha contact_phone (dado pessoal) para qualquer
-- usuario autenticado do tenant. Restringe a leitura ao dono da chamada ou a
-- admin/supervisor. call_queue_members e ring_group_members continuam abertos
-- a authenticated por serem telefonia operacional (catálogo, sem PII).

DROP POLICY IF EXISTS parked_calls_select_auth ON public.parked_calls;

CREATE POLICY parked_calls_select_self_or_staff
  ON public.parked_calls
  FOR SELECT
  TO authenticated
  USING (
    parked_by = auth.uid()
    OR public.is_admin_user(auth.uid())
    OR public.is_supervisor()
  );
