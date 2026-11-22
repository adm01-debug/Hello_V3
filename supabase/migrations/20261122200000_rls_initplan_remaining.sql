-- Initplan: envolver auth.uid()/auth.jwt()/auth.role() em (SELECT ...) nas policies remanescentes.
-- Medido em produção (2026-11-22): 19 expressões em 12 policies / 6 tabelas sem o wrapper.
-- Efeito: o planner avalia a função uma vez por query em vez de uma vez por linha.
-- Nenhuma mudança de semântica: o valor de auth.uid() é constante dentro da transação.

ALTER POLICY "Agents can view own audit logs" ON public.call_control_audit_logs
  USING (is_admin_or_supervisor() OR (source = ((SELECT auth.jwt()) ->> 'email')));

ALTER POLICY "Users manage own dialer favorites" ON public.dialer_favorites
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Authenticated can insert versions" ON public.entity_versions
  WITH CHECK ((SELECT auth.uid()) = changed_by);

ALTER POLICY "Authenticated can view versions" ON public.entity_versions
  USING ((SELECT auth.uid()) IS NOT NULL);

ALTER POLICY "parked_calls_insert_self" ON public.parked_calls
  WITH CHECK ((parked_by = (SELECT auth.uid())) AND (status = 'parked'::text));

ALTER POLICY "parked_calls_update_retrieve" ON public.parked_calls
  USING (((status = 'parked'::text) OR is_admin_or_supervisor()))
  WITH CHECK (is_admin_or_supervisor()
    OR ((status <> 'parked'::text) AND (retrieved_by = (SELECT auth.uid())))
    OR ((status = 'parked'::text) AND (parked_by = (SELECT auth.uid()))));

ALTER POLICY "Users can delete own filters" ON public.saved_filters
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own filters" ON public.saved_filters
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update own filters" ON public.saved_filters
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own filters" ON public.saved_filters
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Leitura de configurações para autenticados" ON public.system_settings
  USING ((SELECT auth.role()) = 'authenticated'::text);

ALTER POLICY "All authenticated can view voip settings" ON public.voip_monitoring_settings
  USING ((SELECT auth.role()) = 'authenticated'::text);

ALTER POLICY "Admins update any profile" ON public.user_profiles
  USING (is_admin_user((SELECT auth.uid())))
  WITH CHECK (is_admin_user((SELECT auth.uid())));

ALTER POLICY "Users update own profile" ON public.user_profiles
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);