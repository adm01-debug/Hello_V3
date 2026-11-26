-- Gate do achado A-141: o log de auditoria de redacao de conteudo sensivel
-- (public.redaction_log, escrito pela edge redact-sensitive-audio) so pode ser
-- lido por admin, e o service_role -- que e quem grava -- precisa continuar
-- lendo. A tela que consome este log e o card "Historico de redacoes" da aba
-- Redacao PCI em /voice-security.
--
-- Roda dentro de transacao revertida no fim (nada fica gravado no banco).
-- Qualquer passo fora do esperado levanta excecao: com ON_ERROR_STOP o job fica
-- vermelho. Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1. RLS habilitado na tabela
do $$
declare v_rls boolean;
begin
  select relrowsecurity into v_rls from pg_class where oid = 'public.redaction_log'::regclass;
  if v_rls is not true then
    raise exception 'FALHA 1: RLS desabilitado em public.redaction_log';
  end if;
  raise notice 'OK 1: RLS habilitado em public.redaction_log';
end $$;

-- 2. Toda policy de SELECT exige is_admin_user(); nenhuma aberta
do $$
declare v_select int; v_com_admin int; v_aberta int;
begin
  select count(*) filter (where cmd in ('SELECT', 'ALL')),
         count(*) filter (where cmd in ('SELECT', 'ALL') and coalesce(qual, '') ilike '%is_admin_user%'),
         count(*) filter (where coalesce(qual, '') in ('true', '(true)'))
    into v_select, v_com_admin, v_aberta
    from pg_policies where schemaname = 'public' and tablename = 'redaction_log';

  if v_select = 0 then
    raise exception 'FALHA 2: redaction_log sem policy de leitura -- nem admin leria (a tela ficaria sempre vazia)';
  end if;
  if v_com_admin <> v_select then
    raise exception 'FALHA 2: % de % policy(ies) de leitura de redaction_log nao passam por is_admin_user()', v_select - v_com_admin, v_select;
  end if;
  if v_aberta > 0 then
    raise exception 'FALHA 2: % policy(ies) de redaction_log liberam leitura para qualquer um', v_aberta;
  end if;
  raise notice 'OK 2: % policy(ies) de leitura de redaction_log, todas condicionadas a is_admin_user()', v_select;
end $$;

-- 3. Nenhuma policy de escrita: so o service_role (edge) grava
do $$
declare v_escrita int;
begin
  select count(*) into v_escrita
    from pg_policies
   where schemaname = 'public' and tablename = 'redaction_log'
     and cmd in ('INSERT', 'UPDATE', 'DELETE');
  if v_escrita > 0 then
    raise exception 'FALHA 3: % policy(ies) de escrita em redaction_log -- um log de auditoria nao pode ser editavel pelo cliente', v_escrita;
  end if;
  raise notice 'OK 3: redaction_log sem policy de escrita (somente o service_role da edge grava)';
end $$;

-- 4. Linha de teste (o dono da conexao ignora RLS); revertida no rollback final
insert into public.redaction_log (call_session_id, pattern_type, match_count, segments, status)
values (null, 'gate-cpf', 2, '[{"pattern":"cpf"}]'::jsonb, 'completed');

-- 5. anon e usuario logado comum nao enxergam o log (RLS ou privilegio)
do $$
declare
  v_count bigint;
  v_negado boolean;
  v_role text;
begin
  for i in 1..2 loop
    v_role := case when i = 1 then 'anon' else 'authenticated' end;
    if not pg_has_role(current_user, v_role::name, 'member') then
      raise notice 'OK 5 (%): pulado -- a conexao % nao tem o papel % para assumir', v_role, current_user, v_role;
      continue;
    end if;
    v_count := null;
    v_negado := false;
    begin
      execute format('set local role %I', v_role);
      perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ff"}', true);
      select count(*) into v_count from public.redaction_log;
    exception
      when insufficient_privilege then
        v_negado := true;
      when others then
        reset role;
        raise exception 'FALHA 5: papel % recebeu erro inesperado: %', v_role, sqlerrm;
    end;
    reset role;
    if not v_negado and coalesce(v_count, 0) <> 0 then
      raise exception 'FALHA 5: % leu % linha(s) do log de redacao sem ser admin', v_role, v_count;
    end if;
    raise notice 'OK 5: % sem acesso ao log de redacao (%)',
      v_role,
      (case when v_negado then 'permission denied' else 'zero linhas' end);
  end loop;
end $$;

-- 6. service_role continua lendo: e o que a edge usa para gravar e consultar
do $$
declare v_count bigint;
begin
  begin
    set local role service_role;
    select count(*) into v_count from public.redaction_log where pattern_type = 'gate-cpf';
  exception
    when others then
      reset role;
      raise exception 'FALHA 6: service_role nao le redaction_log (%): a edge redact-sensitive-audio deixa de auditar', sqlerrm;
  end;
  reset role;
  if coalesce(v_count, 0) <> 1 then
    raise exception 'FALHA 6: service_role leu % linha(s) (esperado 1) -- a edge perde o log de auditoria', v_count;
  end if;
  raise notice 'OK 6: service_role le o log (edge redact-sensitive-audio auditando)';
end $$;

-- 7. Admin de verdade (user_roles) enxerga a linha: e o que alimenta o card da tela
do $$
declare
  v_admin uuid;
  v_count bigint;
begin
  select user_id into v_admin from public.user_roles where role::text = 'admin' limit 1;
  if v_admin is null then
    raise notice 'OK 7: pulado -- nenhum usuario com papel admin em user_roles para provar a leitura';
    return;
  end if;
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin)::text, true);
    select count(*) into v_count from public.redaction_log where pattern_type = 'gate-cpf';
  exception
    when others then
      reset role;
      raise exception 'FALHA 7: admin % recebeu erro inesperado: %', v_admin, sqlerrm;
  end;
  reset role;
  if coalesce(v_count, 0) <> 1 then
    raise exception 'FALHA 7: admin % leu % linha(s) (esperado 1) -- o card Historico de redacoes ficaria vazio', v_admin, v_count;
  end if;
  raise notice 'OK 7: admin le o log (card Historico de redacoes operavel)';
end $$;

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;