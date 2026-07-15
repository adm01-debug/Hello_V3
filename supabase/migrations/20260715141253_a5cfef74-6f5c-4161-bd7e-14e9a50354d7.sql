
-- Onda 41: Inline auth.uid() em RLS policies para performance
-- Padrão Supabase: (SELECT auth.uid()) permite ao planner cachear o valor
-- em vez de re-executar auth.uid() por linha (ganho 10-100x em bulk).

-- 1. webhook_flush_metrics
DROP POLICY IF EXISTS authenticated_insert_own_flush_metrics ON public.webhook_flush_metrics;
CREATE POLICY authenticated_insert_own_flush_metrics
  ON public.webhook_flush_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2. call_control_audit_logs
DROP POLICY IF EXISTS "Agents log own call control events" ON public.call_control_audit_logs;
CREATE POLICY "Agents log own call control events"
  ON public.call_control_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_supervisor()
    OR (source = ((SELECT auth.jwt()) ->> 'email'))
    OR (source = ((SELECT auth.uid()))::text)
  );

-- 3. kb_article_views
DROP POLICY IF EXISTS "Agents insert own kb views" ON public.kb_article_views;
CREATE POLICY "Agents insert own kb views"
  ON public.kb_article_views
  FOR INSERT
  TO authenticated
  WITH CHECK (viewer_type = 'agent' AND viewer_id = (SELECT auth.uid()));
