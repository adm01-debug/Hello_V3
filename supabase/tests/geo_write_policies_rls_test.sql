-- Gate da etapa 043 (achado A-068): a tela de bloqueio geografico precisa gravar.
--
-- O diagnostico dizia que geo_settings/geo_restrictions so tinham SELECT e que
-- geo_access_logs so tinha INSERT/DELETE. Se as policies de escrita existem (ha
-- "Admins can manage geo_settings" e "Admins can manage geo restrictions" no
-- historico), este gate confirma com efeito real; se nao existem, ele falha e a
-- tela continua mostrando sucesso sem gravar.
--
-- Roda dentro de transacao revertida (nada fica gravado).
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- Inventario das policies geo_* (fica registrado no log do workflow).
do $$
declare r record;
begin
  for r in
    select tablename, policyname, cmd, roles::text as roles
    from pg_policies
    where schemaname = 'public' and tablename like 'geo\_%'
    order by tablename, cmd, policyname
  loop
    raise notice 'existente: %.% cmd=% roles=%', r.tablename, r.policyname, r.cmd, r.roles;
  end loop;
end $$;

-- 1. Policy de escrita restrita a admin, TO authenticated, para cada operacao
--    que a tela executa (src/hooks/useGeoBlocking.ts:61 insert, :71 update,
--    :82 insert, :91 delete).
do $$
declare
  v_req record;
  v_falta text[] := '{}';
begin
  for v_req in
    select * from (values
      ('geo_settings', 'INSERT'), ('geo_settings', 'UPDATE'),
      ('geo_restrictions', 'INSERT'), ('geo_restrictions', 'DELETE')
    ) as t(tab, cmd)
  loop
    if not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = v_req.tab
        and (p.cmd = v_req.cmd or p.cmd = 'ALL')
        and 'authenticated' = any (p.roles)
        and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%is_admin%'
    ) then
      v_falta := v_falta || (v_req.tab || ':' || v_req.cmd);
    end if;
  end loop;

  if array_length(v_falta, 1) > 0 then
    raise exception 'FALHA 1: sem policy de escrita de admin para % (RLS devolve 0 linhas e a tela anuncia sucesso)', array_to_string(v_falta, ', ');
  end if;
  raise notice 'OK 1: geo_settings tem INSERT/UPDATE e geo_restrictions tem INSERT/DELETE de admin';
end $$;

-- 2. Privilegio de tabela: policy sem GRANT continua afetando 0 linhas.
do $$
begin
  if not has_table_privilege('authenticated', 'public.geo_settings', 'INSERT') then
    raise exception 'FALHA 2: authenticated sem GRANT INSERT em geo_settings';
  end if;
  if not has_table_privilege('authenticated', 'public.geo_settings', 'UPDATE') then
    raise exception 'FALHA 2: authenticated sem GRANT UPDATE em geo_settings';
  end if;
  if not has_table_privilege('authenticated', 'public.geo_restrictions', 'INSERT') then
    raise exception 'FALHA 2: authenticated sem GRANT INSERT em geo_restrictions';
  end if;
  if not has_table_privilege('authenticated', 'public.geo_restrictions', 'DELETE') then
    raise exception 'FALHA 2: authenticated sem GRANT DELETE em geo_restrictions';
  end if;
  raise notice 'OK 2: authenticated tem os privilegios de escrita que a tela usa';
end $$;

-- 3. Efeito real: admin salva configuracao, poe e tira um pais da lista.
select user_id::text as admin_user_id
from public.user_roles
where role = 'admin'
  and coalesce(is_active, true)
  and (expires_at is null or expires_at > now())
order by user_id
limit 1 \gset

\if :{?admin_user_id}
select set_config('request.jwt.claims', json_build_object('sub', :'admin_user_id')::text, true);
set local role authenticated;

do $$
declare
  v_n integer;
  v_id uuid;
begin
  insert into public.geo_settings (enabled, mode, log_blocked_attempts, notify_on_block)
  values (false, 'allowlist', true, false)
  returning id into v_id;
  if v_id is null then
    raise exception 'FALHA 3: admin nao conseguiu criar geo_settings (RLS devolveu 0 sem erro)';
  end if;

  update public.geo_settings set enabled = false where id = v_id;
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'FALHA 3: admin alterou % linha(s) de geo_settings; o esperado e 1', v_n;
  end if;

  insert into public.geo_restrictions (country_code, country_name, restriction_type)
  values ('ZZ', 'Pais de teste do gate', 'blocked');
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'FALHA 3: admin inseriu % linha(s) em geo_restrictions; o esperado e 1', v_n;
  end if;

  delete from public.geo_restrictions where country_code = 'ZZ';
  get diagnostics v_n = row_count;
  if v_n <> 1 then
    raise exception 'FALHA 3: admin removeu % linha(s) de geo_restrictions; o esperado e 1', v_n;
  end if;

  raise notice 'OK 3: admin cria/edita configuracao e adiciona/remove pais (1 linha cada)';
end $$;

reset role;
\else
\echo 'SKIP 3: nenhum admin valido no banco — passo de efeito real nao executado'
\endif

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;