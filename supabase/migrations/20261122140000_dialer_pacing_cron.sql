-- Discador preditivo: gatilho periodico do ajuste de ritmo.
-- A edge dialer-pacing-tick so era chamada pelo botao manual do ObservabilityDashboard,
-- entao apply_predictive_pacing nunca rodava sozinho: o pace das campanhas ativas
-- ficava congelado no valor inicial e o abandono nao era corrigido.
--
-- O token mora no Vault (secret 'dialer_cron_token') e e lido no disparo. Para rotacionar:
--   select vault.update_secret((select id from vault.secrets where name='dialer_cron_token'), '<novo>');
-- e atualizar o secret DIALER_CRON_TOKEN da edge para o mesmo valor.
--
-- Idempotente: cria o secret so se nao existir e re-agenda o job com o mesmo nome.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'dialer_cron_token') THEN
    RAISE EXCEPTION 'secret dialer_cron_token ausente no Vault: crie-o antes (vault.create_secret) para o cron do discador nao disparar sem credencial';
  END IF;
END $$;

SELECT cron.unschedule('dialer-pacing-tick')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dialer-pacing-tick');

-- A cada minuto: o ritmo precisa reagir ao abandono corrente, nao a um lote diario.
SELECT cron.schedule(
  'dialer-pacing-tick',
  '* * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/dialer-pacing-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'dialer_cron_token'
      )
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $job$
);
