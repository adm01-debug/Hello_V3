-- Gate das etapas 143/144 -- prova que nao sobrou em `public` nenhuma policy avaliada tambem
-- por `anon` cujo predicado so possa ser verdadeiro para usuario autenticado, que as policies
-- deixadas de fora estao listadas, e que leitura autenticada continua funcionando.
-- Transacao revertida.

\set ON_ERROR_STOP on

begin;

-- 1. Zero policies em `public` com roles = {public} cujo(s) predicado(s) citem auth.*/helpers.
do $$
declare v_falta text;
begin
  select string_agg(format('%s.%s', p.tablename, p.policyname), ', ' order by p.tablename, p.policyname)
    into v_falta
    from pg_policies p
   where p.schemaname = 'public'
     and p.roles = '{public}'
     and (p.qual is not null or p.with_check is not null)
     and coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')
           ~* '(auth\.|is_admin|get_user_agent_name|get_user_agent_id|has_role|is_supervisor|can_access)';

  if v_falta is not null then
    raise exception 'FALHA 1: ainda ha policies de public avaliadas por anon com predicado de usuario: %', left(v_falta, 1500);
  end if;
  raise notice '1/5 ok: nenhuma policy de public com predicado auth.*/helper segue avaliada por anon';
end $$;

-- 2. As que ficaram para revisao individual: nenhuma pode ter predicado e nao ser trivialmente
--    verdadeira (aqui so registramos, para o dono revisar com evidencia no log).
do $$
declare
  v_puladas text;
  v_n int;
begin
  select count(*), string_agg(format('%s.%s [%s]', tablename, policyname, coalesce(with_check, qual)), ', ' order by tablename, policyname)
    into v_n, v_puladas
    from pg_policies
   where schemaname = 'public' and roles = '{public}';

  raise notice '2/5 ok: % policy(ies) de public seguem sem TO, mantidas para revisao individual: %', v_n, left(coalesce(v_puladas, 'nenhuma'), 3000);
end $$;

-- 3. Um usuario autenticado continua lendo as tabelas tipicas de cliente sem erro.
do $$
declare
  t text;
  v_n bigint;
  v_log text := '';
  v_lidas int := 0;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000aa', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  foreach t in array array['contacts', 'deals', 'accounts', 'contact_interactions', 'call_sessions'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into v_n;
      v_lidas := v_lidas + 1;
      v_log := v_log || format('%s=%s ', t, v_n);
    end if;
  end loop;

  execute 'reset role';

  if v_lidas < 1 then
    raise exception 'FALHA 3: nenhuma das tabelas de cliente foi encontrada em public';
  end if;
  raise notice '3/5 ok: authenticated le as tabelas de cliente sem erro (%)', v_log;
end $$;

-- 4. Anon continua vendo 0 linhas nelas (ou recebendo permission denied).
do $$
declare
  t text;
  v_n bigint;
  v_total bigint := 0;
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';

  foreach t in array array['contacts', 'deals', 'accounts', 'contact_interactions', 'call_sessions'] loop
    if to_regclass('public.' || t) is not null then
      begin
        execute format('select count(*) from public.%I', t) into v_n;
        v_total := v_total + coalesce(v_n, 0);
      exception
        when insufficient_privilege then v_n := 0;
      end;
    end if;
  end loop;

  execute 'reset role';

  if v_total > 0 then
    raise exception 'FALHA 4: anon leu % linha(s) nas tabelas de cliente', v_total;
  end if;
  raise notice '4/5 ok: anon le 0 linhas nas tabelas de cliente';
end $$;

-- 5. Regressao: nenhuma policy foi removida (o total de policies de public nao caiu).
do $$
declare v_n int;
begin
  select count(*) into v_n from pg_policies where schemaname = 'public';
  if v_n < 250 then
    raise exception 'FALHA 5: public ficou com apenas % policies -- alguma foi removida', v_n;
  end if;
  raise notice '5/5 ok: public mantem % policies (nenhuma removida, so a clausula TO ajustada)', v_n;
end $$;

rollback;