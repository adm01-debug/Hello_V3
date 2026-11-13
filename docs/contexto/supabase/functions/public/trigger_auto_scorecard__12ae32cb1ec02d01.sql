CREATE OR REPLACE FUNCTION public.trigger_auto_scorecard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_url TEXT := 'https://dyibdjwuoibwwpidgsxu.supabase.co/functions/v1/auto-scorecard';
  v_key TEXT := '[REDACTED_JWT]';
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
$function$
