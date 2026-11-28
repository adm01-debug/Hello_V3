-- Gate da etapa 081: a chamada atendida precisa conseguir registrar o CALL_ID
-- do Bitrix em call_sessions, e so o dono da sessao pode gravar nele.
--
-- src/hooks/useMultiChannelCall.ts grava a sessao ao atender (E058) e, em
-- seguida, atualiza bitrix_call_id com o id devolvido por
-- telephony.externalcall.register. Nenhuma policy nova foi criada: o gate prova
-- que o caminho de escrita que o hook usa (INSERT + UPDATE pela sessao do
-- agente) funciona em producao.
--
-- A producao nao tem o vinculo (usuario -> agente) preenchido, e a policy de
-- INSERT de call_sessions exige agent_name = get_user_agent_name(): o vinculo e
-- montado aqui dentro, na transacao revertida no fim.
--
-- Roda em transacao revertida: nada fica gravado.
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1/4: a coluna existe.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'call_sessions'
      and column_name = 'bitrix_call_id' and data_type = 'text'
  ) then
    raise exception 'FALHA 1: call_sessions.bitrix_call_id (text) nao existe: o CALL_ID do Bitrix se perde entre o atendimento e o desfecho';
  end if;
  raise notice '1/4 ok: call_sessions.bitrix_call_id existe (text)';
end $$;

-- 2/4: existe policy de UPDATE alcançando authenticated.
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'call_sessions'
      and p.cmd in ('UPDATE', 'ALL') and 'authenticated' = any (p.roles)
  ) then
    raise exception 'FALHA 2: nenhuma policy de UPDATE em call_sessions para authenticated: o agente nao consegue gravar o desfecho nem o CALL_ID';
  end if;
  raise notice '2/4 ok: policy de UPDATE em call_sessions alcanca authenticated';
end $$;

-- 3/4 e 4/4: dono da sessao grava, terceiro nao.
do $$
declare
  r record;
  v_a uuid;
  v_b uuid;
  v_sessao uuid;
  v_agente_id uuid;
  v_agente text;
  v_gravou bigint;
  v_lido text;
  v_alterou bigint;
  v_negado boolean := false;
begin
  for r in select u.id from auth.users u order by u.created_at limit 200 loop
    perform set_config('request.jwt.claims', json_build_object('sub', r.id)::text, true);
    if not coalesce(public.is_admin_or_supervisor(), false) then
      if v_a is null then
        v_a := r.id;
      elsif r.id <> v_a then
        v_b := r.id;
        exit;
      end if;
    end if;
  end loop;
  perform set_config('request.jwt.claims', '', true);

  if v_a is null then
    raise notice '3/4 pulado: nenhum usuario nao-admin em auth.users';
    return;
  end if;

  -- Vinculo usuario -> agente, montado dentro da transacao revertida.
  select a.id, a.name into v_agente_id, v_agente from public.agents a order by a.name limit 1;
  if v_agente_id is null then
    insert into public.agents (name, extension) values ('gate-081 agente', 'gate081')
    returning id, name into v_agente_id, v_agente;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'email'
  ) then
    insert into public.user_profiles (id, email, agent_id)
    values (v_a, 'gate-081@local.invalid', v_agente_id)
    on conflict (id) do update set agent_id = excluded.agent_id;
  else
    insert into public.user_profiles (id, agent_id)
    values (v_a, v_agente_id)
    on conflict (id) do update set agent_id = excluded.agent_id;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_a)::text, true);
  if public.get_user_agent_name() is null then
    raise exception 'FALHA 3: o vinculo criado nao resolve agent_name (usuario %, agente %)', v_a, v_agente_id;
  end if;
  raise notice '3/4 info: vinculo usuario->agente criado na transacao (agente %)', v_agente;

  -- 3/4: INSERT no padrao do E058 + UPDATE do CALL_ID, como o hook faz.
  execute 'set local role authenticated';
  begin
    execute $q$ insert into public.call_sessions (caller_name, caller_phone, agent_name, status)
               values ('Gate 081', '5511900000000', public.get_user_agent_name(), 'active')
               returning id $q$ into v_sessao;
  exception when others then
    execute 'reset role';
    raise exception 'FALHA 3: o agente nao consegue gravar a propria call_sessions (E058/E059): %', sqlerrm;
  end;

  execute $q$ update public.call_sessions set bitrix_call_id = 'gate-081-call'
              where id = $1 $q$ using v_sessao;
  get diagnostics v_gravou = row_count;
  execute 'reset role';

  if v_gravou <> 1 then
    raise exception 'FALHA 3: o agente nao gravou bitrix_call_id na propria sessao (% linhas): o CALL_ID do Bitrix fica sem destino', v_gravou;
  end if;

  select bitrix_call_id into v_lido from public.call_sessions where id = v_sessao;
  if v_lido is distinct from 'gate-081-call' then
    raise exception 'FALHA 3: bitrix_call_id gravado = % (esperado gate-081-call)', v_lido;
  end if;
  raise notice '3/4 ok: agente comum grava a sessao e o bitrix_call_id da propria chamada';

  -- 4/4: terceiro nao altera a sessao do dono; anon nao escreve.
  if v_b is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_b)::text, true);
    execute 'set local role authenticated';
    execute $q$ update public.call_sessions set bitrix_call_id = 'forjado'
                where id = $1 $q$ using v_sessao;
    get diagnostics v_alterou = row_count;
    execute 'reset role';
    if v_alterou <> 0 then
      raise exception 'FALHA 4: outro usuario alterou o bitrix_call_id da sessao alheia (% linhas)', v_alterou;
    end if;
    raise notice '4/4 ok: terceiro nao altera o CALL_ID da sessao do dono';
  else
    raise notice '4/4 parcial: so existe 1 usuario nao-admin; prova de alteracao alheia pulada';
  end if;

  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
  begin
    execute $q$ update public.call_sessions set bitrix_call_id = 'anon'
                where id = $1 $q$ using v_sessao;
    get diagnostics v_alterou = row_count;
    execute 'reset role';
  exception when others then
    v_negado := true;
    execute 'reset role';
  end;
  if not v_negado and v_alterou <> 0 then
    raise exception 'FALHA 4: anon alterou a sessao (% linhas)', v_alterou;
  end if;
  raise notice '4/4 ok: anon nao escreve em call_sessions';
end $$;

rollback;