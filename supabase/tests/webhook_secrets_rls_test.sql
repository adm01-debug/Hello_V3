-- Gate do achado A-140: os segredos HMAC de webhook de entrada nao podem ser
-- lidos por quem nao e admin, e o service_role (usado por verifyWebhookSignature
-- em supabase/functions/_shared/hmac.ts) precisa continuar lendo.
--
-- Antes desta entrega a tabela existia, a edge respondia 401 sem segredo e nao
-- havia nenhuma tela para cadastrar/rotacionar -- o webhook de entrada era
-- inoperavel. A tela agora existe (WebhookSecretsCard em /admin/webhook-health);
-- este gate protege a RLS que ela usa.
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
  select relrowsecurity into v_rls from pg_class where oid = 'public.webhook_secrets'::regclass;
  if v_rls is not true then
    raise exception 'FALHA 1: RLS desabilitado em public.webhook_secrets';
  end if;
  raise notice 'OK 1: RLS habilitado em public.webhook_secrets';
end $$;

-- 2. So existe politica de admin, e nenhuma politica condicional=false
do $$
declare v_total int; v_admin int; v_aberta int;
begin
  select count(*) into v_total from pg_policies where schemaname = 'public' and tablename = 'webhook_secrets';
  select count(*) into v_admin
    from pg_policies
   where schemaname = 'public'
     and tablename = 'webhook_secrets'
     and coalesce(qual, '') || coalesce(with_check, '') like '%is_admin_or_supervisor%';
  select count(*) into v_aberta
    from pg_policies
   where schemaname = 'public'
     and tablename = 'webhook_secrets'
     and (btrim(coalesce(qual, 'true')) = 'true' or btrim(coalesce(with_check, 'true')) = 'true');
  if v_total = 0 then
    raise exception 'FALHA 2: webhook_secrets sem nenhuma politica (a tela de admin nao consegue ler nem gravar)';
  end if;
  if v_admin <> v_total then
    raise exception 'FALHA 2: % de % politicas nao checam is_admin_or_supervisor', v_total - v_admin, v_total;
  end if;
  if v_aberta > 0 then
    raise exception 'FALHA 2: % politica(s) liberam webhook_secrets sem checar papel', v_aberta;
  end if;
  raise notice 'OK 2: % politica(s) de webhook_secrets, todas condicionadas a is_admin_or_supervisor()', v_total;
end $$;

-- 3. Linha de teste (o dono da conexao ignora RLS); revertida no rollback final
insert into public.webhook_secrets (provider, secret_key)
values ('gate-webhook-secrets', 'gate-generic-provider-secret-0123456789')
on conflict (provider) do update set secret_key = excluded.secret_key;

-- 4. anon e usuario logado comum nao enxergam o segredo (RLS ou privilegio)
do $$
declare
  v_count bigint;
  v_negado boolean;
  v_role text;
begin
  for i in 1..2 loop
    v_role := case when i = 1 then 'anon' else 'authenticated' end;
    if not pg_has_role(current_user, v_role, 'member') then
      raise notice 'OK 4 (%): pulado -- a conexao % nao tem o papel % para assumir', v_role, current_user, v_role;
      continue;
    end if;
    v_count := null;
    v_negado := false;
    begin
      execute format('set local role %I', v_role);
      perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ff"}', true);
      select count(*) into v_count from public.webhook_secrets;
    exception
      when insufficient_privilege then
        v_negado := true;
      when others then
        reset role;
        raise exception 'FALHA 4: papel % recebeu erro inesperado: %', v_role, sqlerrm;
    end;
    reset role;
    if not v_negado and coalesce(v_count, 0) <> 0 then
      raise exception 'FALHA 4: % leu % segredo(s) de webhook sem ser admin', v_role, v_count;
    end if;
    raise notice 'OK 4: % sem acesso aos segredos (%)',
      v_role,
      (case when v_negado then 'permission denied' else 'zero linhas' end);
  end loop;
end $$;

-- 5. Usuario logado comum nao consegue cadastrar provedor (WITH CHECK)
do $$
declare v_recusou boolean := false;
begin
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000ff"}', true);
    insert into public.webhook_secrets (provider, secret_key) values ('gate-intruso', 'intruso-0123456789');
  exception
    when insufficient_privilege then
      v_recusou := true;
    when others then
      reset role;
      raise exception 'FALHA 5: authenticated recebeu erro inesperado ao inserir: %', sqlerrm;
  end;
  reset role;
  if not v_recusou then
    raise exception 'FALHA 5: usuario logado comum cadastrou segredo de webhook';
  end if;
  raise notice 'OK 5: cadastro de segredo exige admin';
end $$;

-- 6. service_role continua lendo: e o que mantem a verificacao HMAC das edges viva
do $$
declare v_count bigint;
begin
  begin
    set local role service_role;
    select count(*) into v_count from public.webhook_secrets where provider = 'gate-webhook-secrets';
  exception
    when others then
      reset role;
      raise exception 'FALHA 6: service_role nao le webhook_secrets (%): as edges webhook-handler e analyze-call passam a recusar tudo', sqlerrm;
  end;
  reset role;
  if coalesce(v_count, 0) <> 1 then
    raise exception 'FALHA 6: service_role leu % linhas (esperado 1) -- a verificacao HMAC quebra', v_count;
  end if;
  raise notice 'OK 6: service_role le o segredo (HMAC das edges funcionando)';
end $$;

-- 7. Admin de verdade (se existir em user_roles) enxerga a linha
do $$
declare
  v_admin uuid;
  v_count bigint;
  v_negado boolean := false;
begin
  select user_id into v_admin from public.user_roles where role::text in ('admin', 'supervisor') limit 1;
  if v_admin is null then
    raise notice 'OK 7: pulado -- nenhum usuario admin/supervisor em user_roles para provar a leitura';
    return;
  end if;
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', v_admin)::text, true);
    select count(*) into v_count from public.webhook_secrets where provider = 'gate-webhook-secrets';
  exception
    when others then
      reset role;
      raise exception 'FALHA 7: admin % recebeu erro inesperado: %', v_admin, sqlerrm;
  end;
  reset role;
  if v_negado or coalesce(v_count, 0) <> 1 then
    raise exception 'FALHA 7: admin % leu % linha(s) (esperado 1) -- a tela de segredos nao funcionaria', v_admin, v_count;
  end if;
  raise notice 'OK 7: admin le o segredo (tela /admin/webhook-health operavel)';
end $$;

\echo '=== fim: nada foi gravado (rollback) ==='
rollback;