CREATE OR REPLACE FUNCTION public.trigger_auto_scorecard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_key text;
BEGIN
  IF NEW.summary IS NULL OR length(NEW.summary) < 20 THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
   WHERE name = 'auto_scorecard_token';

  IF v_key IS NULL OR v_key = '' THEN
    RAISE WARNING 'auto-scorecard: segredo auto_scorecard_token ausente, enfileiramento ignorado';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := public.edge_function_url('auto-scorecard'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('call_session_id', NEW.call_session_id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto-scorecard enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$function$
