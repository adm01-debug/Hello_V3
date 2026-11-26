-- Etapa 145: fechar o restante de public/storage ainda avaliado pelo role public.
--
-- Estado real lido do catalogo (run 45851414557) antes desta migration:
--   * storage.objects: 7 policies, TODAS ja `TO authenticated`; os 5 buckets
--     (avatars, call-recordings, data-lake-exports, queue-audio, virtual-fax-docs)
--     sao privados (`storage.buckets.public = false`) e nenhum codigo chama
--     `getPublicUrl` — todo acesso passa por `createSignedUrl` ou pelo service role.
--   * public: sobraram exatamente 6 policies com roles = {public}, todas
--     deny-policies `WITH CHECK (false)` (account_lockouts x3, audit_logs,
--     login_attempts, voip_trunk_health_checks).
--
-- Restringir uma deny-policy de `public` para `authenticated` nao muda o veredito
-- de ninguem: quem casa com a policy continua negado (with check false) e quem
-- nao casa cai no deny default da RLS, que gera o mesmo erro. O ganho e sair do
-- estado "avaliada por anon" exigido pelo criterio da etapa.
--
-- A lista e lida do banco (nunca hardcoded) e apenas a clausula TO e trocada.

do $$
declare
  r record;
  v_total int := 0;
  v_storage_auth int := 0;
begin
  for r in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname in ('public', 'storage')
       and roles = '{public}'
     order by schemaname, tablename, policyname
  loop
    execute format('alter policy %I on %I.%I to authenticated', r.policyname, r.schemaname, r.tablename);
    v_total := v_total + 1;
    raise notice 'etapa 145: % % restringida a authenticated', r.tablename, r.policyname;
  end loop;

  select count(*) into v_storage_auth
    from pg_policies
   where schemaname = 'storage'
     and tablename = 'objects'
     and roles = '{authenticated}';

  raise notice 'etapa 145: % policy(ies) restringida(s); storage.objects ja tinha % policy(ies) TO authenticated', v_total, v_storage_auth;
end $$
