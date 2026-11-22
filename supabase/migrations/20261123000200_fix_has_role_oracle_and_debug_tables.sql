-- 1) has_role(uuid, app_role): ultima funcao SECURITY DEFINER executavel por anon que
--    aceita uuid do chamador. MEDIDO antes desta migration: anon sem JWT chamou
--    has_role(<uuid de um admin>, 'admin') e recebeu `true` (200).
--    Todas as 8 policies que a usam passam auth.uid(); revogar de anon nao as afeta.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Tabelas de diagnostico deixadas por uma sessao anterior (tentativa de descobrir o
--    DSN do banco). Sem consumidor no codigo, sem RLS declarada aqui, 1 e 4 linhas de
--    restos de teste. Removidas para nao ficarem expostas como superficie de ataque.
DROP TABLE IF EXISTS public.__dsn_probe;
DROP TABLE IF EXISTS public.__dbg;
