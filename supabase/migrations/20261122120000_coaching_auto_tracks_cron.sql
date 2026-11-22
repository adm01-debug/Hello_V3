-- D4: gatilho periodico do coaching automatico.
-- A edge generate-coaching-track so nasce por invocacao manual (supervisor/admin).
-- Este job fecha o fluxo: toda madrugada analisa as chamadas recentes e abre trilhas
-- para os agentes cujo indicador ficou abaixo do alvo.
--
-- O token NAO fica no texto da migration. Ele mora no Vault (secret
-- 'coaching_cron_token') e e lido no momento do disparo. Para rotacionar:
--   select vault.update_secret((select id from vault.secrets where name='coaching_cron_token'), '<novo>');
-- e atualizar o secret COACHING_CRON_TOKEN da edge para o mesmo valor.
--
-- Idempotente: cria o secret so se nao existir e re-agenda o job com o mesmo nome.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'coaching_cron_token') THEN
    RAISE EXCEPTION 'secret coaching_cron_token ausente no Vault: crie-o antes (vault.create_secret) para o cron de coaching nao disparar sem credencial';
  END IF;
END $$;

SELECT cron.unschedule('generate-coaching-tracks-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-coaching-tracks-daily');

SELECT cron.schedule(
  'generate-coaching-tracks-daily',
  '15 3 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/generate-coaching-track',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'coaching_cron_token'
      )
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $job$
);
