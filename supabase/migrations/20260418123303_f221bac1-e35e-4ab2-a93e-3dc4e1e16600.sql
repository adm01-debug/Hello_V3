
-- ============================================================
-- ONDA 23 — Security Hardening (P0)
-- 1) Remover meeting_summaries da publicação Realtime (vazamento cross-agent)
-- 2) Bloquear INSERT direto em user_profiles (trigger handle_new_user é o único caminho)
-- 3) Adicionar SELECT explícito em geo_settings (admin/supervisor)
-- ============================================================

-- 1. Realtime: meeting_summaries fora da publicação
ALTER PUBLICATION supabase_realtime DROP TABLE public.meeting_summaries;

-- 2. user_profiles: bloquear INSERT do usuário (apenas trigger SECURITY DEFINER pode inserir)
DROP POLICY IF EXISTS "Users can insert own profile with agent role" ON public.user_profiles;

-- Admin INSERT policy permanece intocada ("Admins can insert profiles with any role")

-- 3. geo_settings: SELECT explícito para admin/supervisor (evita ambiguidade do ALL policy)
CREATE POLICY "Admins supervisors view geo_settings"
ON public.geo_settings
FOR SELECT
TO authenticated
USING (is_admin_or_supervisor());

-- Comentário documentando decisão arquitetural
COMMENT ON POLICY "Admins supervisors view geo_settings" ON public.geo_settings IS
'ADR-038: SELECT explícito para auditabilidade; complementa "Admins can manage geo_settings" (ALL).';
