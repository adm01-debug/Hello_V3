-- O sistema tem duas fontes de papel de usuario que podem divergir:
--   * public.user_roles.role (enum app_role) -> usada por is_admin_or_supervisor(),
--     que governa ~255 policies (a maior parte do RLS do produto)
--   * public.user_profiles.role (text)      -> usada por 3 policies de admin
--     (rls_audit_logs, webhook_secrets) e pelo trigger de hotspot de conflito,
--     que notifica SELECT ... FROM user_profiles WHERE role='admin'
--
-- Medido em producao em 22/11/2026: 1 usuario com user_profiles.role='admin' e
-- nenhuma linha em user_roles. Ele aparece como admin no painel de conflitos e
-- recebe as notificacoes de hotspot, mas tudo protegido por
-- is_admin_or_supervisor() devolve vazio. Acesso quebrado em silencio.
--
-- Esta migration NAO escolhe uma fonte nova nem altera policies: apenas garante
-- que o que ja esta declarado em user_profiles exista tambem em user_roles, sem
-- REMOVER nada (nunca rebaixa acesso por uma migration). Idempotente.

DO $reconcile$
DECLARE
  v_fixed  integer := 0;
  v_orphan integer;
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  SELECT up.id, up.role::public.app_role
  FROM public.user_profiles up
  WHERE up.role IN ('admin', 'supervisor', 'agent', 'manager')
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = up.id AND ur.role::text = up.role
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_fixed = ROW_COUNT;
  RAISE NOTICE 'user_roles reconciliado: % linha(s) criada(s)', v_fixed;

  SELECT count(*) INTO v_orphan
  FROM public.user_profiles up
  WHERE up.role IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = up.id);

  IF v_orphan > 0 THEN
    RAISE WARNING '% usuario(s) continuam sem nenhuma linha em user_roles (role fora do enum app_role?)', v_orphan;
  END IF;
END
$reconcile$;

COMMENT ON COLUMN public.user_profiles.role IS
'Campo legado de papel. A fonte de verdade para autorizacao e public.user_roles (ver is_admin_or_supervisor()). Mantenha as duas em sincronia; a divergencia faz o usuario aparecer como admin sem ter acesso.';
