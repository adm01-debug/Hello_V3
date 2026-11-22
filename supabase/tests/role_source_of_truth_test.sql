-- Gate de regressao: nenhum objeto de autorizacao pode ler user_profiles.role.
--
-- user_profiles.role e uma coluna espelho de exibicao. A fonte de verdade para
-- autorizacao e public.user_roles.role, exposta por is_admin_or_supervisor() e
-- is_admin_user(). Quando algo volta a ler a coluna espelho, o sistema passa a
-- ter duas respostas para "esse usuario e admin?" e uma delas fica defasada.
--
-- Qualquer linha retornada por esta consulta e uma violacao.

SELECT 'policies' AS categoria,
       schemaname || '.' || tablename || '.' || policyname AS objeto
FROM pg_policies
WHERE qual LIKE '%user_profiles.role%'
   OR with_check LIKE '%user_profiles.role%'

UNION ALL

SELECT 'funcoes' AS categoria,
       n.nspname || '.' || p.proname AS objeto
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  -- get_user_role/get_profile_role caem para user_profiles.role como fallback
  -- de exibicao, e isso e intencional: nao ha linha em user_roles para migrar.
  -- handle_new_user apenas grava o papel inicial no cadastro; nao autoriza.
  AND p.proname NOT IN ('get_user_role', 'get_profile_role', 'handle_new_user')
  AND pg_get_functiondef(p.oid) LIKE '%user_profiles%'
  AND pg_get_functiondef(p.oid) LIKE '%role%'

UNION ALL

-- As duas fontes devem concordar. Linha aqui = usuario com papel numa fonte e
-- nao na outra.
SELECT 'divergencia_dados' AS categoria,
       up.id::text || ' profiles=' || coalesce(up.role, 'null') AS objeto
FROM public.user_profiles up
WHERE coalesce(up.role, '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = up.id
      AND ur.role::text = up.role
  )

UNION ALL

-- Funcoes que decidem autorizacao lendo user_roles devem honrar is_active e
-- expires_at. Estas quatro sao as que governam policies e checagens de acesso.
SELECT 'sem_filtro_validade' AS categoria,
       n.nspname || '.' || p.proname AS objeto
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_supervisor', 'is_admin_user', 'is_admin_or_supervisor', 'has_role', 'has_permission', 'get_user_roles')
  AND NOT (
    pg_get_functiondef(p.oid) LIKE '%is_active%'
    AND pg_get_functiondef(p.oid) LIKE '%expires_at%'
  );