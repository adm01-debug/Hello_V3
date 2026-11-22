-- ADR-044 prometia retencao automatica de 90 dias em optimistic_lock_conflicts
-- (cron semanal, domingo 03:00 UTC, chamando cleanup-lock-conflicts). O cron
-- nunca foi criado e a edge so aceitava admin, entao a purga nunca rodou. Agora
-- que a auditoria de conflitos passou a gravar de verdade, a tabela cresceria
-- sem limite. Este job fecha o fluxo.
--
-- O token nao fica no texto da migration: mora no Vault em
-- 'cleanup_lock_conflicts_cron_token' e e lido no momento do disparo. Para
-- rotacionar:
--   select vault.update_secret(
--     (select id from vault.secrets where name='cleanup_lock_conflicts_cron_token'),
--     '<novo>');
-- e atualizar o secret CLEANUP_CRON_TOKEN da edge para o mesmo valor.
--
-- Idempotente: re-agenda o job com o mesmo nome.

DO $guard$
DECLARE v_token uuid;
BEGIN
  SELECT id INTO v_token FROM vault.secrets WHERE name = 'cleanup_lock_conflicts_cron_token';
  IF v_token IS NULL THEN
    PERFORM vault.create_secret(
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
      'cleanup_lock_conflicts_cron_token',
      'Token do cron semanal de purga de optimistic_lock_conflicts (>90 dias)'
    );
  END IF;
END
$guard$;

SELECT cron.unschedule('cleanup-lock-conflicts-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-lock-conflicts-weekly');

SELECT cron.schedule(
  'cleanup-lock-conflicts-weekly',
  '0 3 * * 0',
  $job$
  SELECT net.http_post(
    url := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/cleanup-lock-conflicts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cleanup_lock_conflicts_cron_token'
      )
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $job$
);
