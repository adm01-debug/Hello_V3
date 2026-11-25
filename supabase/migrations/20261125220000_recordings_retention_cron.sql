-- Retencao das gravacoes de chamada (item C2 de docs/audits/pendencias-2026-07.md).
--
-- Ate aqui nada apagava `call_recordings` nem o bucket `call-recordings`.
-- `database-cleanup` cobre 5 tabelas de seguranca e nao toca storage, entao as
-- gravacoes cresceriam sem limite. A regra de negocio e 180 dias, implementada
-- na edge `cleanup-recordings`.
--
-- O token mora no Vault ('cleanup_recordings_cron_token') e e lido no disparo,
-- mesmo padrao do cron de lock-conflicts. Para rotacionar:
--   select vault.update_secret(
--     (select id from vault.secrets where name='cleanup_recordings_cron_token'),
--     '<novo>');
-- e atualizar o secret RECORDINGS_CRON_TOKEN da edge para o mesmo valor.
--
-- Idempotente: re-agenda o job com o mesmo nome.

DO $guard$
DECLARE v_token uuid;
BEGIN
  SELECT id INTO v_token FROM vault.secrets WHERE name = 'cleanup_recordings_cron_token';
  IF v_token IS NULL THEN
    PERFORM vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'cleanup_recordings_cron_token',
      'Token do cron diario de retencao de gravacoes (180 dias)'
    );
  END IF;
END
$guard$;

SELECT cron.unschedule('cleanup-recordings-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-recordings-daily');

SELECT cron.schedule(
  'cleanup-recordings-daily',
  '45 3 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/cleanup-recordings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cleanup_recordings_cron_token'
      )
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $job$
);
