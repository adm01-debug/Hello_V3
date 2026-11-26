-- Gate da etapa 002 (achado A-019): as RPCs de lockout de login nao podem ser
-- chamaveis pelo navegador.
--
-- Antes: SECURITY DEFINER com EXECUTE para anon — saber o email bastava para
-- travar a conta de um operador (5 falhas) e para zerar o contador de falhas.
-- Depois: chamaveis apenas pela edge login-attempt (service role).
--
-- Roda dentro de transacao revertida no fim (nada fica gravado no banco).
-- Qualquer passo fora do esperado levanta excecao: com ON_ERROR_STOP o job fica
-- vermelho. Rodar com: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

do $$
declare
  v_assinatura text;
begin
  for v_assinatura in
    select unnest(array[
      'public.check_login_lockout(text)',
      'public.record_failed_login(text, text, text)',
      'public.record_successful_login(text, text, text)'
    ])
  loop
    if has_function_privilege('anon', v_assinatura, 'EXECUTE') then
      raise exception 'FALHA: anon ainda executa % (a conta de qualquer operador pode ser travada por terceiros)', v_assinatura;
    end if;
    if has_function_privilege('authenticated', v_assinatura, 'EXECUTE') then
      raise exception 'FALHA: authenticated ainda executa % (usuario logado pode zerar o lockout de outro)', v_assinatura;
    end if;
    if not has_function_privilege('service_role', v_assinatura, 'EXECUTE') then
      raise exception 'FALHA: service_role perdeu EXECUTE em % (a edge login-attempt para de funcionar)', v_assinatura;
    end if;
    raise notice 'OK: % exclusiva de service_role', v_assinatura;
  end loop;
end $$;


-- Passo 3 (efeito real): como anon, o banco recusa a chamada.
do $$
declare v_recusou boolean := false; v_autenticado_recusou boolean := false;
begin
  begin
    set local role anon;
    perform public.record_failed_login('gate-anon@example.com', null, 'gate');
  exception
    when insufficient_privilege then
      v_recusou := true;
    when others then
      reset role;
      raise exception 'FALHA 3: anon recebeu erro inesperado: %', sqlerrm;
  end;
  reset role;
  if not v_recusou then
    raise exception 'FALHA 3: anon executou record_failed_login -- o banco nao esta protegido';
  end if;
  raise notice 'OK 3: anon recebe permission denied ao tentar travar uma conta';
  begin
    set local role authenticated;
    perform public.check_login_lockout('gate-anon@example.com');
  exception
    when insufficient_privilege then
      v_autenticado_recusou := true;
    when others then
      reset role;
      raise exception 'FALHA 3: authenticated recebeu erro inesperado: %', sqlerrm;
  end;
  reset role;
  if not v_autenticado_recusou then
    raise exception 'FALHA 3: authenticated executou check_login_lockout';
  end if;
  raise notice 'OK 3b: authenticated recebe permission denied';
end $$;

-- Passo 4 (efeito real): por dentro o lockout continua funcionando, e a edge
-- (service role) continua conseguindo chamar.
do $$
declare v_res jsonb; i int;
begin
  set local role service_role;
  for i in 1..5 loop
    select public.record_failed_login('gate-lock@example.com', '10.0.0.9', 'gate') into v_res;
  end loop;
  select public.check_login_lockout('gate-lock@example.com') into v_res;
  reset role;
  if coalesce((v_res->>'locked')::boolean, false) is not true then
    raise exception 'FALHA 4: 5 falhas nao bloquearam a conta (retorno: %)', v_res;
  end if;
  set local role service_role;
  perform public.record_successful_login('gate-lock@example.com', '10.0.0.9', 'gate');
  select public.check_login_lockout('gate-lock@example.com') into v_res;
  reset role;
  if coalesce((v_res->>'locked')::boolean, false) then
    raise exception 'FALHA 4: login bem-sucedido nao limpou o bloqueio (retorno: %)', v_res;
  end if;
  raise notice 'OK 4: service_role continua registrando falhas e limpando o bloqueio';
end $$;

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;
