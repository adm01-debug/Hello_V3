-- fix: remove referência ao projeto morto dyibdjwuoibwwpidgsxu
-- O trigger de auto-scorecard e o cron data-lake-flush-daily apontavam para um
-- projeto Supabase anterior cujo DNS não resolve. As edge functions auto-scorecard
-- e data-lake-flush estão deployadas e ativas no projeto atual cfmlmcdyjuotqobjapng.
-- Reaponta URL para o projeto vivo e troca a chave anon (a mesma chave era usada
-- como variável embutida; anon é segredo de baixo risco, service_role NUNCA vai em SQL).

CREATE OR REPLACE FUNCTION public.trigger_auto_scorecard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/auto-scorecard';
  v_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTQsImV4cCI6MjEwMDQ4NTQxNH0.3vn9Pm5G3kKPKJrDAjUVgh5gXhYgawgKiM3bFstFEAk';
BEGIN
  IF NEW.summary IS NULL OR length(NEW.summary) < 20 THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('call_session_id', NEW.call_session_id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto-scorecard enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Cron: data-lake-flush diário às 03:00 UTC apontando para o projeto atual
DO $$
BEGIN
  PERFORM cron.unschedule('data-lake-flush-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'data-lake-flush-daily',
  '0 3 * * *',
  $$SELECT net.http_post(
      url := 'https://cfmlmcdyjuotqobjapng.supabase.co/functions/v1/data-lake-flush',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbWxtY2R5anVvdHFvYmphcG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MDk0MTQsImV4cCI6MjEwMDQ4NTQxNH0.3vn9Pm5G3kKPKJrDAjUVgh5gXhYgawgKiM3bFstFEAk'
      ),
      body := jsonb_build_object('trigger', 'cron')
    );$$
);
