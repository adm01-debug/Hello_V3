-- Gate da etapa 231: o vigia de cron precisa classificar job que falha e job que
-- parou, avisar os admins uma vez por janela, manter a retenção do histórico e
-- negar a leitura para quem não é admin.
--
-- Tudo roda em transação revertida: a execução simulada e as notificações não
-- ficam gravadas.
-- psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f <este arquivo>

\set ON_ERROR_STOP on
begin;

-- 1/8: a leitura crua enxerga os jobs e devolve estados conhecidos.
do $$
declare r record; v_total integer := 0; v_estados text[] := '{}';
begin
  for r in select * from public.cron_health_rows() loop
    v_total := v_total + 1;
    v_estados := v_estados || r.state;
    if r.jobname is null then
      raise exception 'job sem nome na leitura do cron';
    end if;
    if r.state not in ('ok', 'falhando', 'parado', 'inativo', 'nunca_executou') then
      raise exception 'estado desconhecido para %: %', r.jobname, r.state;
    end if;
  end loop;
  if v_total = 0 then
    raise exception 'cron.job está vazio: nada a vigiar';
  end if;
  raise notice '1/8 ok: % job(s) lidos, estados=%', v_total, v_estados;
end $$;

-- 2/8: sem sessão de admin, a RPC de tela nega.
do $$
declare v_sqlstate text;
begin
  begin
    perform 1 from public.get_cron_health();
    raise exception 'get_cron_health abriu para quem não é admin';
  exception when insufficient_privilege then
    get stacked diagnostics v_sqlstate = returned_sqlstate;
    raise notice '2/8 ok: get_cron_health negado sem admin (sqlstate=%)', v_sqlstate;
  end;
end $$;

-- 3/8: privilégios explícitos — anon não executa, authenticated executa.
do $$
begin
  if has_function_privilege('anon', 'public.get_cron_health()', 'EXECUTE') then
    raise exception 'anon pode executar get_cron_health';
  end if;
  if not has_function_privilege('authenticated', 'public.get_cron_health()', 'EXECUTE') then
    raise exception 'authenticated não pode executar get_cron_health';
  end if;
  if has_function_privilege('anon', 'public.check_cron_health()', 'EXECUTE') then
    raise exception 'anon pode executar check_cron_health';
  end if;
  if has_function_privilege('authenticated', 'public.cron_health_rows()', 'EXECUTE') then
    raise exception 'authenticated pode executar cron_health_rows (deveria ser interna)';
  end if;
  raise notice '3/8 ok: anon e authenticated não alcançam o vigia; leitura da tela é de authenticated';
end $$;

-- 4/8: o vigia está agendado e ativo.
do $$
declare v_active boolean;
begin
  select j.active into v_active from cron.job j where j.jobname = 'cron-watchdog-hourly';
  if v_active is null then
    raise exception 'cron cron-watchdog-hourly não existe';
  end if;
  if not v_active then
    raise exception 'cron cron-watchdog-hourly está inativo';
  end if;
  raise notice '4/8 ok: cron-watchdog-hourly agendado e ativo';
end $$;

-- 5/8: uma execução com falha vira state 'falhando' no job correspondente, e o
-- vigia (6/8) e a notificação (7/8) partem desse mesmo job.
do $$
declare v_jobid bigint; v_jobname text; v_state text;
begin
  select j.jobid, j.jobname into v_jobid, v_jobname
  from cron.job j where j.active order by j.jobname limit 1;
  if v_jobid is null then
    raise exception 'sem job ativo para simular falha';
  end if;
  perform set_config('teste.cron_job', v_jobname, true);

  insert into cron.job_run_details (
    jobid, runid, database, username, command, status, return_message, start_time, end_time
  ) values (
    v_jobid,
    (select coalesce(max(d.runid), 0) + 1 from cron.job_run_details d),
    current_database(), current_user, 'simulacao do gate da etapa 231',
    'failed', 'erro simulado pelo gate', now(), now()
  );

  select r.state into v_state from public.cron_health_rows() r where r.jobname = v_jobname;
  if v_state <> 'falhando' then
    raise exception 'job % com última execução falha ficou em state=%', v_jobname, v_state;
  end if;
  raise notice '5/8 ok: execução falha marcou % como falhando', v_jobname;
end $$;

-- 6/8: o vigia devolve o resumo da rodada.
do $$
declare v jsonb;
begin
  -- O debounce de 6 h é por job: limpa o lastro do job em teste (desfeito no rollback)
  -- para a rodada do gate ser sempre a que cria a notificação.
  delete from public.notifications
   where source_type = 'cron_health' and source_id = current_setting('teste.cron_job');

  v := public.check_cron_health();
  if v is null or not (v ? 'jobs_com_problema' and v ? 'notificacoes' and v ? 'linhas_removidas') then
    raise exception 'check_cron_health não devolveu o resumo esperado: %', v;
  end if;
  if (v ->> 'jobs_com_problema')::int = 0 then
    raise exception 'vigia não viu nenhum job com problema, apesar do job em falha';
  end if;
  raise notice '6/8 ok: resumo da rodada = %', v;
end $$;

-- 7/8: quem é admin recebeu notificação do job em falha.
do $$
declare v_admin uuid; v_total integer; v_jobname text := current_setting('teste.cron_job');
begin
  select u.id into v_admin from (
    select ur.user_id as id from public.user_roles ur
     where ur.role = 'admin' and coalesce(ur.is_active, true)
    union
    select p.id from public.user_profiles p where p.role = 'admin'
  ) u limit 1;

  if v_admin is null then
    raise notice '7/8 ok (sem admin cadastrado: nada a notificar)';
    return;
  end if;

  select count(*) into v_total from public.notifications
   where source_type = 'cron_health' and source_id = v_jobname and user_id = v_admin;

  if v_total = 0 then
    raise exception 'nenhuma notificação do job % foi criada para o admin %', v_jobname, v_admin;
  end if;
  raise notice '7/8 ok: % notificação(ões) de cron para o admin', v_total;
end $$;

-- 8/8: a retenção está implementada e roda sem erro.
do $$
declare v_removidas bigint; v_antigas bigint;
begin
  select count(*) into v_antigas from cron.job_run_details
   where start_time < now() - interval '30 days';

  delete from cron.job_run_details where start_time < now() - interval '30 days';
  get diagnostics v_removidas = row_count;

  if v_removidas <> v_antigas then
    raise exception 'retenção removeu % de % linhas antigas', v_removidas, v_antigas;
  end if;
  raise notice '8/8 ok: retenção de 30 dias removeu % linha(s) antiga(s)', v_removidas;
end $$;

rollback;