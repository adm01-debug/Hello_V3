-- Sonda (etapa 083): estado real da fila de sincronizacao do CRM e do gatilho.
-- Somente leitura, tudo em transacao revertida no fim. Nao imprime valor de segredo.
begin;

select 'tabela' as probe, coalesce(to_regclass('public.crm_sync_queue')::text, '(ausente)') as valor;
select 'colunas' as probe, string_agg(column_name || ':' || data_type, ', ' order by ordinal_position) as valor
  from information_schema.columns where table_schema = 'public' and table_name = 'crm_sync_queue';
select 'rls' as probe, (select c.relrowsecurity::text from pg_class c where c.oid = to_regclass('public.crm_sync_queue')) as valor;
select 'policies' as probe, coalesce((select string_agg(policyname || '/' || cmd || '/' || roles::text, ' | ')
  from pg_policies where schemaname = 'public' and tablename = 'crm_sync_queue'), '(nenhuma)') as valor;
select 'total' as probe, (select count(*)::text from public.crm_sync_queue) as valor;
select 'por_status' as probe, coalesce((select string_agg(coalesce(status, '(nulo)') || '=' || n, ', ')
  from (select status, count(*)::text as n from public.crm_sync_queue group by 1) s), '(vazio)') as valor;
select 'por_action' as probe, coalesce((select string_agg(coalesce(action, '(nulo)') || '=' || n, ', ')
  from (select action, count(*)::text as n from public.crm_sync_queue group by 1) s), '(vazio)') as valor;
select 'tentativas' as probe, coalesce((select string_agg(attempts::text || '=' || n, ', ')
  from (select attempts, count(*)::text as n from public.crm_sync_queue group by 1) s), '(vazio)') as valor;
select 'pendente_mais_antigo' as probe, coalesce((select min(created_at)::text from public.crm_sync_queue
  where status in ('pending', 'failed')), '(nenhum)') as valor;
select 'pendente_vencido_agora' as probe, (select count(*)::text from public.crm_sync_queue
  where status in ('pending', 'failed') and next_retry_at <= now() and attempts < 5) as valor;
select 'ultimo_erro' as probe, coalesce((select max(last_error) from public.crm_sync_queue), '(nulo)') as valor;
select 'jobs_que_citam_crm' as probe, coalesce((select string_agg(jobname || ' | ' || schedule, ', ')
  from cron.job where command ilike '%crm%'), '(nenhum)') as valor;
select 'jobs_http_post' as probe, coalesce((select string_agg(jobname, ', ')
  from cron.job where command like '%net.http_post%'), '(nenhum)') as valor;
select 'secret_crm_sync_cron_token' as probe, (exists (select 1 from vault.secrets where name = 'crm_sync_cron_token'))::text as valor;
select 'rpc_token_cron_valido' as probe, (to_regprocedure('public.token_cron_valido(text,text)') is not null)::text as valor;
select 'execucoes_sync_crm' as probe, coalesce((select string_agg(j.jobname || ':' || d.status || ':' || d.start_time::text, ' | ')
  from cron.job_run_details d join cron.job j on j.jobid = d.jobid where j.command ilike '%sync-crm-queue%'), '(nenhuma)') as valor;

do $probe$
declare v_url text;
begin
  if to_regprocedure('public.edge_function_url(text)') is not null then
    execute 'select public.edge_function_url(''sync-crm-queue'')' into v_url;
    raise notice 'edge_function_url(sync-crm-queue) = %', coalesce(v_url, '(nulo)');
  else
    raise notice 'edge_function_url(text) ausente no banco';
  end if;
  if to_regclass('net._http_response') is not null then
    execute 'select count(*)::text from net._http_response' into v_url;
    raise notice 'net._http_response linhas = %', v_url;
  else
    raise notice 'net._http_response ausente';
  end if;
end
$probe$;

rollback;