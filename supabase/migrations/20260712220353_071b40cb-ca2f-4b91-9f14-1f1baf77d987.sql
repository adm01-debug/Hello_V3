
-- 1) call_control_audit_logs INSERT: restringe forjação
DROP POLICY IF EXISTS "Agents can log call control events" ON public.call_control_audit_logs;
CREATE POLICY "Agents log own call control events"
ON public.call_control_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_supervisor()
  OR source = (auth.jwt() ->> 'email')
  OR source = auth.uid()::text
);

-- 2) crm_field_suggestions SELECT: só admin/supervisor
DROP POLICY IF EXISTS "Usuários autenticados leem sugestões CRM" ON public.crm_field_suggestions;
CREATE POLICY "Admin supervisor read crm suggestions"
ON public.crm_field_suggestions
FOR SELECT
TO authenticated
USING (public.is_admin_or_supervisor());

-- 3) crm_sync_queue INSERT: só admin/supervisor (edge functions usam service_role)
DROP POLICY IF EXISTS "Agentes podem inserir na fila CRM" ON public.crm_sync_queue;
CREATE POLICY "Admin supervisor insert crm sync queue"
ON public.crm_sync_queue
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_supervisor());

-- 4) kb_article_views INSERT: só agentes autenticados no próprio nome
DROP POLICY IF EXISTS "Authenticated insert own kb views" ON public.kb_article_views;
CREATE POLICY "Agents insert own kb views"
ON public.kb_article_views
FOR INSERT
TO authenticated
WITH CHECK (
  viewer_type = 'agent'
  AND viewer_id = auth.uid()
);
