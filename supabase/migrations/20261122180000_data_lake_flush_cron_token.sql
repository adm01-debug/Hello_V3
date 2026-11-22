-- Endurece o cron data-lake-flush: token dedicado em vez da anon key publica.
--
-- A edge aceitava qualquer JWT do projeto (`isProjectKey`), ou seja a anon key
-- que esta no bundle do front. Qualquer visitante do site podia disparar a
-- exportacao de call_sessions, call_summaries e deals para o bucket
-- data-lake-exports. Os outros quatro crons (dialer, coaching, cleanup,
-- recordings) sempre usaram token dedicado; este era o unico fora do padrao.
--
-- O token mora no Vault ('data_lake_cron_token') e e lido no disparo, mesmo
-- padrao do cron de retencao de gravacoes. Para rotacionar:
--   select vault.update_secret(
--     (select id from vault.secrets where name='data_lake_cron_token'),
--     '<novo>');
-- e atualizar o secret DATA_LAKE_CRON_TOKEN da edge para o mesmo valor.
--
-- Idempotente: nao sobrescreve um token existente nem duplica o job.

DO $guard$
DECLARE v_token uuid;
BEGIN
  SELECT id INTO v_token FROM vault.secrets WHERE name = 'data_lake_cron_token';
  IF v_token IS NULL THEN
    PERFORM vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'data_lake_cron_token',
      'Token do cron diario do data-lake-flush (03:00 UTC)'
    );
  END IF;
END
$guard$;

SELECT cron.unschedule('data-lake-flush-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'data-lake-flush-daily');

SELECT cron.schedule(
  'data-lake-flush-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/data-lake-flush',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'data_lake_cron_token'
      )
    ),
    body := jsonb_build_object('trigger', 'cron'),
    timeout_milliseconds := 120000
  );
  $$
);
