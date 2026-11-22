-- Regressao: user_profiles.role e user_roles precisam concordar.
--
-- O sistema tem duas fontes de papel de usuario:
--   * public.user_roles       -> usada por is_admin_or_supervisor(), que governa
--                                ~255 policies (a maioria do RLS do produto)
--   * public.user_profiles.role -> usada por 3 policies de admin
--                                (rls_audit_logs, webhook_secrets)
-- O trigger de hotspot de conflito ainda notifica por user_profiles.role.
--
-- Medido em producao em 22/11: um usuario com user_profiles.role='admin' e NENHUMA
-- linha em user_roles. Ele aparecia como admin em /concurrency-conflicts e recebia
-- as notificacoes de hotspot, mas qualquer query protegida por is_admin_or_supervisor()
-- retornava vazio. Papel divergente e acesso silenciosamente quebrado.
--
-- Este teste falha se as duas fontes divergirem. Roda com pgTAP ou, na ausencia
-- dele, como SELECT direto: qualquer linha retornada = falha.

SELECT
  up.id AS user_id,
  coalesce(up.role::text, '(null)') AS profile_role,
  coalesce(
    (SELECT string_agg(ur.role::text, ',' ORDER BY ur.role) FROM public.user_roles ur WHERE ur.user_id = up.id),
    '(nenhum)'
  ) AS user_roles
FROM public.user_profiles up
WHERE (up.role = 'admin') <> EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = up.id AND ur.role = 'admin'
)
   OR (up.role = 'supervisor') <> EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = up.id AND ur.role = 'supervisor'
);
