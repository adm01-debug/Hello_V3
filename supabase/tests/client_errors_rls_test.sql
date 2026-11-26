-- Gate da etapa 230 (A-097): erros do navegador persistidos em client_errors.
-- Roda dentro de transacao revertida (migrations.yml modo=verificar).
--   1) tabela existe com RLS habilitada
--   2) as tres policies esperadas existem (insert proprio, leitura e resolucao de admin)
--   3) anon nao tem privilegio de INSERT
--   4) usuario autenticado grava o proprio erro
--   5) usuario autenticado NAO grava erro em nome de outro (WITH CHECK)
--   6) usuario comum nao le os erros (0 linhas sob RLS)
--   7) admin/supervisor le e marca como resolvido
--   8) CHECK de tamanho rejeita mensagem acima de 1000 caracteres

\set ON_ERROR_STOP on
begin;

-- 1 e 2: estrutura e policies
do $$
declare
  v_rls boolean;
  v_pol integer;
begin
  select c.relrowsecurity into v_rls
    from pg_class c
   where c.oid = 'public.client_errors'::regclass;
  if v_rls is not true then
    raise exception 'client_errors existe mas esta sem RLS';
  end if;
  raise notice '1/8 ok: client_errors existe com RLS habilitada';

  select count(*) into v_pol
    from pg_policies
   where schemaname = 'public' and tablename = 'client_errors';
  if v_pol < 3 then
    raise exception 'esperava 3 policies em client_errors, obteve %', v_pol;
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'client_errors'
                  and policyname = 'authenticated_insert_own_client_errors') then
    raise exception 'policy de insert proprio ausente';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'client_errors'
                  and policyname = 'admins_supervisors_read_client_errors') then
    raise exception 'policy de leitura de admin ausente';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'client_errors'
                  and policyname = 'admins_supervisors_resolve_client_errors') then
    raise exception 'policy de resolucao de admin ausente';
  end if;
  raise notice '2/8 ok: policies de insert proprio, leitura e resolucao presentes';
end $$;

-- 3: anon nao escreve (sem GRANT, nem policy)
do $$
begin
  if not pg_has_role(current_user, 'anon'::name, 'member') then
    raise notice '3/8 pulado: anon nao e assumivel por %', current_user;
    return;
  end if;
  begin
    execute 'set local role anon';
  exception when insufficient_privilege then
    raise notice '3/8 pulado: sem privilegio para assumir anon';
    return;
  end;

  begin
    execute 'insert into public.client_errors (route, message) values (''/x'', ''anon'')';
  exception when insufficient_privilege then
    execute 'reset role';
    raise notice '3/8 ok: anon sem privilegio de INSERT em client_errors';
    return;
  end;

  execute 'reset role';
  raise exception 'anon conseguiu inserir em client_errors';
end $$;

-- papeis para simular: um admin/supervisor e um usuario comum
select ur.user_id as admin_id
  from public.user_roles ur
 where ur.role in ('admin', 'supervisor')
   and coalesce(ur.is_active, true)
   and (ur.expires_at is null or ur.expires_at > now())
 limit 1 \gset

select u.id as comum_id
  from auth.users u
 where u.id <> :'admin_id'
   and not exists (
     select 1 from public.user_roles r
      where r.user_id = u.id
        and r.role in ('admin', 'supervisor')
        and coalesce(r.is_active, true)
   )
 order by u.created_at nulls last, u.id
 limit 1 \gset

\if :{?comum_id}
\else
  \echo 'PULADO 4-8: nao ha admin + usuario comum em auth.users'
  rollback;
  \quit
\endif

select set_config('teste.admin_id', :'admin_id', true);
select gen_random_uuid() as err_id \gset
select set_config('teste.err_id', :'err_id', true);

-- 4: usuario grava o proprio erro
select set_config('request.jwt.claims', json_build_object('sub', :'comum_id')::text, true);
set local role authenticated;
insert into public.client_errors (id, user_id, route, error_type, message, correlation_id)
values (:'err_id', :'comum_id', '/calls', 'unhandled-rejection', 'TypeError: x is not a function', 'trace-gate-230');

do $$ begin
  if (select count(*) from public.client_errors where id = current_setting('teste.err_id')::uuid) <> 0 then
    raise exception 'FALHA: usuario comum nao deveria ler o proprio erro (policy de leitura e de admin)';
  end if;
  raise notice '4/8 ok: usuario comum gravou o proprio erro (%)', current_setting('teste.err_id');
end $$;

-- 5: nao grava em nome de outro
do $$
declare
  v_admin uuid := current_setting('teste.admin_id')::uuid;
begin
  begin
    insert into public.client_errors (user_id, route, message) values (v_admin, '/calls', 'forjado');
    raise exception 'FALHA: usuario comum gravou erro em nome de outro usuario';
  exception when insufficient_privilege then
    raise notice '5/8 ok: WITH CHECK barra insert em nome de outro usuario';
  end;
end $$;

-- 6: usuario comum nao le (nem os proprios)
do $$ begin
  if (select count(*) from public.client_errors) <> 0 then
    raise exception 'FALHA: usuario comum leu erros do cliente';
  end if;
  raise notice '6/8 ok: usuario comum nao le client_errors';
end $$;

-- 7: admin le e resolve
select set_config('request.jwt.claims', json_build_object('sub', :'admin_id')::text, true);
do $$
declare
  v_err uuid := current_setting('teste.err_id')::uuid;
  v_admin uuid := current_setting('teste.admin_id')::uuid;
  v_rows integer;
begin
  if (select count(*) from public.client_errors where id = v_err) <> 1 then
    raise exception 'FALHA: admin deveria ler o erro gravado';
  end if;
  update public.client_errors set resolved_at = now(), resolved_by = v_admin where id = v_err;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'FALHA: admin deveria resolver 1 erro, resolveu %', v_rows;
  end if;
  if (select resolved_at is not null and resolved_by = v_admin from public.client_errors where id = v_err) is not true then
    raise exception 'FALHA: resolucao nao persistiu (resolved_at/resolved_by)';
  end if;
  raise notice '7/8 ok: admin le e marca o erro como resolvido';
end $$;

reset role;
select set_config('request.jwt.claims', '', true);

-- 8: CHECK de tamanho
do $$ begin
  begin
    insert into public.client_errors (route, message) values ('/x', repeat('a', 1001));
    raise exception 'FALHA: CHECK de tamanho nao barrou 1001 caracteres';
  exception when check_violation then
    raise notice '8/8 ok: mensagem acima de 1000 caracteres e rejeitada';
  end;
end $$;

rollback;