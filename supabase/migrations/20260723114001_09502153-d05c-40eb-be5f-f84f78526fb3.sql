-- Onda D — trigger auto-scorecard + cron data-lake-flush
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Trigger: enfileira invocação de auto-scorecard após insert em call_summaries
CREATE OR REPLACE FUNCTION public.trigger_auto_scorecard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT := 'https://dyibdjwuoibwwpidgsxu.supabase.co/functions/v1/auto-scorecard';
  v_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aWJkand1b2lid3dwaWRnc3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDk1NTgsImV4cCI6MjA5NDA4NTU1OH0.1YEbYV4udwr7bP4rjd5DVK4ErFWJPNld0KWp-jH-f0o';
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
  -- Nunca bloqueia insert em call_summaries por falha assíncrona
  RAISE WARNING 'auto-scorecard enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_scorecard ON public.call_summaries;
CREATE TRIGGER trg_auto_scorecard
AFTER INSERT ON public.call_summaries
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_scorecard();

-- Cron: data-lake-flush diário às 03:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('data-lake-flush-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'data-lake-flush-daily',
  '0 3 * * *',
  $$SELECT net.http_post(
      url := 'https://dyibdjwuoibwwpidgsxu.supabase.co/functions/v1/data-lake-flush',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aWJkand1b2lid3dwaWRnc3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDk1NTgsImV4cCI6MjA5NDA4NTU1OH0.1YEbYV4udwr7bP4rjd5DVK4ErFWJPNld0KWp-jH-f0o'
      ),
      body := jsonb_build_object('trigger', 'cron')
    );$$
);