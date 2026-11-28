-- Sonda (etapa 083): o job crm-sync-queue esta disparando a edge? Somente leitura.
begin;

do $probe$
declare r record; v_n integer := 0;
begin
  raise notice '--- JOB ---';
  for r in select jobid, jobname, schedule, active from cron.job where jobname = 'crm-sync-queue' loop
    raise notice 'job % schedule=% active=%', r.jobname, r.schedule, r.active;
    v_n := v_n + 1;
  end loop;
  if v_n = 0 then raise notice 'job crm-sync-queue AUSENTE'; end if;

  raise notice '--- EXECUCOES (cron.job_run_details) ---';
  v_n := 0;
  for r in
    select d.status, d.return_message, d.start_time
      from cron.job_run_details d
      join cron.job j on j.jobid = d.jobid
     where j.jobname = 'crm-sync-queue'
     order by d.start_time desc limit 5
  loop
    raise notice 'run % status=% msg=%', r.start_time, r.status, left(coalesce(r.return_message, ''), 120);
    v_n := v_n + 1;
  end loop;
  if v_n = 0 then raise notice 'nenhuma execucao registrada ainda'; end if;

  raise notice '--- RESPOSTAS HTTP (net._http_response, ultimas 5) ---';
  v_n := 0;
  for r in select status_code, created, content from net._http_response order by created desc limit 5 loop
    raise notice 'http % em % corpo=%', r.status_code, r.created, left(coalesce(r.content, ''), 160);
    v_n := v_n + 1;
  end loop;
  if v_n = 0 then raise notice 'nenhuma resposta http registrada'; end if;

  raise notice '--- FILA ---';
  for r in select count(*) as total, count(*) filter (where status = 'pending') as pendentes from public.crm_sync_queue loop
    raise notice 'fila total=% pendentes=%', r.total, r.pendentes;
  end loop;

  raise notice '--- GATE ---';
  for r in select public.token_cron_valido('crm_sync_cron_token', 'x') as vale_troco loop
    raise notice 'token_cron_valido com token errado = % (esperado false)', r.vale_troco;
  end loop;
end
$probe$;

rollback;