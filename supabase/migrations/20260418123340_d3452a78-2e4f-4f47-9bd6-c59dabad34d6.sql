
-- ============================================================
-- ONDA 23 — Security Hardening (P0) — parte 2
-- Endurecer 3 policies "always-true-ish" (auth.uid() IS NOT NULL)
-- ============================================================

-- 1) call_playlists INSERT
DROP POLICY IF EXISTS "Authenticated create playlists" ON public.call_playlists;
CREATE POLICY "Owner or admin create playlists"
ON public.call_playlists
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_supervisor()
  OR owner_agent_name = get_user_agent_name()
);
COMMENT ON POLICY "Owner or admin create playlists" ON public.call_playlists IS
'ADR-038: criação restrita a admin/supervisor ou agente dono.';

-- 2) crm_field_suggestions INSERT/UPDATE
DROP POLICY IF EXISTS "Sistema/usuários autenticados criam sugestões" ON public.crm_field_suggestions;
DROP POLICY IF EXISTS "Usuários autenticados revisam sugestões" ON public.crm_field_suggestions;

CREATE POLICY "Admin supervisor insert crm suggestions"
ON public.crm_field_suggestions
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Admin supervisor update crm suggestions"
ON public.crm_field_suggestions
FOR UPDATE
TO authenticated
USING (is_admin_or_supervisor())
WITH CHECK (is_admin_or_supervisor());

COMMENT ON POLICY "Admin supervisor insert crm suggestions" ON public.crm_field_suggestions IS
'ADR-038: sugestões geradas por IA inseridas via service_role (bypass RLS) ou admin/supervisor.';

-- 3) call_translations INSERT
DROP POLICY IF EXISTS "Authenticated can insert translations" ON public.call_translations;
CREATE POLICY "Owner or admin insert translations"
ON public.call_translations
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_supervisor()
  OR EXISTS (
    SELECT 1 FROM public.call_sessions cs
    WHERE cs.id = call_translations.call_session_id
      AND cs.agent_name = get_user_agent_name()
  )
);
COMMENT ON POLICY "Owner or admin insert translations" ON public.call_translations IS
'ADR-038: inserção requer ownership da call_session ou papel admin/supervisor.';
