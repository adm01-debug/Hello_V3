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

-- 4 a 8: fluxo do usuario, do admin e os CHECKs
do $$
declare
  v_rows integer;
  v_uid uuid;
  v_admin uuid;
  v_admin_email text;
  v_id uuid;
begin
  select ur.user_id into v_admin
    from public.user_roles ur
   where ur.role in ('admin', 'supervisor')
     and coalesce(ur.is_active, true)
     and (ur.expires_at is null or ur.expires_at > now())
   limit 1;
  select up.email into v_admin_email from public.user_profiles up where up.id = v_admin;
  select u.id into v_uid
    from auth.users u
   where u.id <> coalesce(v_admin, u.id)
     and not exists (
       select 1 from public.user_roles r
        where r.user_id = u.id
          and r.role in ('admin', 'supervisor')
          and coalesce(r.is_active, true)
     )
   limit 1;

  if v_admin is null or v_uid is null then
    raise notice '4/8 pulado: faltam papeis para simular (admin=%, comum=%)', v_admin, v_uid;
    return;
  end if;

  begin
    execute 'set local role authenticated';
  exception when insufficient_privilege then
    raise notice '4/8 pulado: runner nao assume o papel authenticated';
    return;
  end;

  -- 4. usuario grava o proprio erro
  perform set_config('request.jwt.claims', json_build_object('sub', v_uid)::text, true);
  execute format(
    'insert into public.client_errors (user_id, route, error_type, message, correlation_id) values (%L, %L, %L, %L, %L) returning id',
    v_uid, '/calls', 'unhandled-rejection', 'TypeError: x is not a function', 'trace-gate-230'
  ) into v_id;
  if v_id is null then
    execute 'reset role';
    raise exception 'insert do proprio erro nao devolveu id';
  end if;
  raise notice '4/8 ok: usuario grava o proprio erro (%)', v_id;

  -- 5. nao grava em nome de outro
  begin
    execute format(
      'insert into public.client_errors (user_id, route, message) values (%L, %L, %L)',
      v_admin, '/calls', 'forjado'
    );
    execute 'reset role';
    raise exception 'usuario comum conseguiu gravar erro em nome de outro usuario';
  exception when insufficient_privilege then
    raise notice '5/8 ok: WITH CHECK barra insert em nome de outro usuario';
  end;

  -- 6. usuario comum nao le (nem os proprios)
  execute 'select count(*) from public.client_errors' into v_rows;
  if v_rows <> 0 then
    execute 'reset role';
    raise exception 'usuario comum leu % erro(s) do cliente', v_rows;
  end if;
  raise notice '6/8 ok: usuario comum nao le client_errors';

  -- 7. admin le e resolve
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'email', v_admin_email)::text, true);
  execute 'select count(*) from public.client_errors' into v_rows;
  if v_rows < 1 then
    execute 'reset role';
    raise exception 'admin deveria ler ao menos 1 erro e leu %', v_rows;
  end if;
  execute format('update public.client_errors set resolved_at = now(), resolved_by = %L where id = %L', v_admin, v_id);
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    execute 'reset role';
    raise exception 'admin deveria resolver 1 erro, resolveu %', v_rows;
  end if;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  if not exists (select 1 from public.client_errors where id = v_id and resolved_at is not null and resolved_by = v_admin) then
    raise exception 'resolucao nao persistiu (resolved_at/resolved_by)';
  end if;
  raise notice '7/8 ok: admin le e marca o erro como resolvido';

  -- 8. CHECK de tamanho
  begin
    insert into public.client_errors (route, message) values ('/x', repeat('a', 1001));
    raise exception 'CHECK de tamanho da mensagem nao barrou 1001 caracteres';
  exception when check_violation then
    raise notice '8/8 ok: mensagem acima de 1000 caracteres e rejeitada';
  end;
end $$;

rollback;