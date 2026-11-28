-- Etapa 083 (ajuste apos medir o tick): o job de 5 min chamava a edge mesmo com a
-- fila vazia. Medido em producao em 2026-11-26 21:50 e 21:55: run 'succeeded'
-- com 1 row e resposta HTTP 401 {"error":"Nao autorizado"} porque a edge ainda
-- roda a versao antiga (o deploy depende de SUPABASE_ACCESS_TOKEN valido, que
-- esta invalido no repositorio). Sao 288 chamadas/dia de uma edge function para
-- nao fazer nada quando a fila esta vazia -- e, hoje, 288 logins recusados.
--
-- Este ajuste poe a condicao de vencimento no proprio comando do cron, igual ao
-- filtro que a edge aplica (status pending/failed, next_retry_at vencido,
-- attempts < 5). Com a fila vazia o job nao faz requisicao nenhuma; o sinal de
-- que o cron esta vivo continua em cron.job_run_details (1 run a cada 5 min).
--
-- Nada mais muda: segredo no Vault, public.token_cron_valido e o helper
-- public.edge_function_url seguem como na 20261128110000.
--
-- Idempotente: unschedule antes de agendar. Reverter:
--   SELECT cron.unschedule('crm-sync-queue');

SELECT cron.unschedule('crm-sync-queue')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'crm-sync-queue')

SELECT cron.schedule(
  'crm-sync-queue',
  '*/5 * * * *',
  $job$
  SELECT net.http_post(
    url := public.edge_function_url('sync-crm-queue'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'crm_sync_cron_token'
      )
    ),
    body := jsonb_build_object('trigger', 'cron', 'limit', 50)
  )
  WHERE EXISTS (
    SELECT 1
      FROM public.crm_sync_queue q
     WHERE q.status IN ('pending', 'failed')
       AND q.next_retry_at <= now()
       AND coalesce(q.attempts, 0) < 5
  );
  $job$
)
