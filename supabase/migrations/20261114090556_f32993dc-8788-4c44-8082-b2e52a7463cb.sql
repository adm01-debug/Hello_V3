-- fix: desativa crons de teste que falham com OPTIMISTIC_LOCK_CONFLICT
-- update-contact-name-daily (jobid 1) e update-user-profile-fullname-daily (jobid 2)
-- são resíduos de SQL Editor: incrementam nome/full_name fixo com version+1,
-- colidindo com o trigger enforce_optimistic_lock. 100% de falha diária (09:00 UTC).
-- Desativar (cron.unschedule) preserva o histórico; não há queda de funcionalidade real.

DO $$
BEGIN
  PERFORM cron.unschedule('update-contact-name-daily');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'update-contact-name-daily ja inexistente: %', SQLERRM;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('update-user-profile-fullname-daily');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'update-user-profile-fullname-daily ja inexistente: %', SQLERRM;
END $$;
