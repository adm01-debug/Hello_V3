-- Gate da etapa 083: a fila de sincronizacao do CRM tem gatilho?
-- Roda em transacao revertida (nada fica gravado).
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>
\set ON_ERROR_STOP on
begin;

-- 1. Segredo do cron e funcao de conferencia existem.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'crm_sync_cron_token') then
    raise exception 'FALHA 1: segredo crm_sync_cron_token ausente no Vault';
  end if;
  if to_regprocedure('public.token_cron_valido(text,text)') is null then
    raise exception 'FALHA 1: public.token_cron_valido(text,text) ausente';
  end if;
  raise notice 'OK 1: segredo do cron e funcao de conferencia presentes';
end $$;

-- 2. Efeito real: so o token do cofre vale.
do $$
declare v_token text; v_ok boolean; v_trocado boolean; v_vazio boolean; v_outro_nome boolean; v_curto boolean;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'crm_sync_cron_token';
  if v_token is null or length(v_token) < 32 then
    raise exception 'FALHA 2: segredo do cron ilegivel ou curto demais';
  end if;

  select public.token_cron_valido('crm_sync_cron_token', v_token) into v_ok;
  select public.token_cron_valido('crm_sync_cron_token', v_token || 'x') into v_trocado;
  select public.token_cron_valido('crm_sync_cron_token', '') into v_vazio;
  select public.token_cron_valido('segredo_que_nao_existe', v_token) into v_outro_nome;
  select public.token_cron_valido('crm_sync_cron_token', 'curto') into v_curto;

  if v_ok is not true then
    raise exception 'FALHA 2: o token real do cofre foi RECUSADO: o cron cairia em 401';
  end if;
  if v_trocado or v_vazio or v_outro_nome or v_curto then
    raise exception 'FALHA 2: aceitou credencial invalida (trocado=%, vazio=%, outro nome=%, curto=%)',
      v_trocado, v_vazio, v_outro_nome, v_curto;
  end if;
  raise notice 'OK 2: token do cofre vale; token trocado, vazio, curto e nome de outro segredo nao valem';
end $$;

-- 3. Quem pode conferir: so a service_role (a edge), com SECURITY DEFINER.
do $$
begin
  if has_function_privilege('anon', 'public.token_cron_valido(text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.token_cron_valido(text,text)', 'EXECUTE') then
    raise exception 'FALHA 3: token_cron_valido exposto para anon/authenticated';
  end if;
  if not has_function_privilege('service_role', 'public.token_cron_valido(text,text)', 'EXECUTE') then
    raise exception 'FALHA 3: service_role (a edge) nao pode executar token_cron_valido';
  end if;
  if not (select prosecdef from pg_proc where oid = 'public.token_cron_valido(text,text)'::regprocedure) then
    raise exception 'FALHA 3: token_cron_valido sem SECURITY DEFINER';
  end if;
  raise notice 'OK 3: conferencia restrita a service_role e marcada SECURITY DEFINER';
end $$;

-- 4. O job existe, no intervalo combinado, lendo URL e token do cofre.
do $$
declare v_schedule text; v_command text;
begin
  select schedule, command into v_schedule, v_command from cron.job where jobname = 'crm-sync-queue';
  if v_schedule is null then
    raise exception 'FALHA 4: job crm-sync-queue ausente: a fila volta a encher sem consumo';
  end if;
  if v_schedule <> '*/5 * * * *' then
    raise exception 'FALHA 4: intervalo inesperado: %', v_schedule;
  end if;
  if v_command not like '%url := public.edge_function_url(''sync-crm-queue'')%' then
    raise exception 'FALHA 4: job nao monta a URL por public.edge_function_url(<slug>)';
  end if;
  if v_command not like '%crm_sync_cron_token%' then
    raise exception 'FALHA 4: job nao le o token do cofre';
  end if;
  if v_command ~ 'eyJhbGciOi|https://[a-z0-9]+\.supabase\.co' then
    raise exception 'FALHA 4: job carrega host ou JWT literal';
  end if;
  raise notice 'OK 4: job crm-sync-queue agendado em % lendo URL e token do cofre', v_schedule;
end $$;

-- 5. O contrato da fila que o job consome continua de pe.
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.crm_sync_queue'::regclass) then
    raise exception 'FALHA 5: RLS desligada em crm_sync_queue';
  end if;
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'crm_sync_queue' and cmd = 'SELECT') = 0 then
    raise exception 'FALHA 5: sem policy de SELECT: a tela de status nao le a fila';
  end if;
  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'crm_sync_queue' and cmd = 'UPDATE') = 0 then
    raise exception 'FALHA 5: sem policy de UPDATE: a tentativa fica em progresso para sempre';
  end if;
  raise notice 'OK 5: crm_sync_queue com RLS, SELECT e UPDATE declarados';
end $$;

rollback;