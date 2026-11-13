CREATE OR REPLACE FUNCTION public.validate_call_queue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Transbordo para fila precisa de alvo válido e diferente de si
  IF NEW.overflow_action = 'transfer_queue' THEN
    IF NEW.overflow_queue_id IS NULL THEN
      RAISE EXCEPTION 'overflow_queue_id é obrigatório quando overflow_action = transfer_queue';
    END IF;
    IF NEW.overflow_queue_id = NEW.id THEN
      RAISE EXCEPTION 'A fila de transbordo não pode ser a própria fila';
    END IF;
  END IF;

  -- MoH habilitado exige URL
  IF NEW.moh_enabled AND NEW.moh_url IS NOT NULL AND length(btrim(NEW.moh_url)) = 0 THEN
    NEW.moh_url := NULL;
  END IF;

  -- Normaliza nome
  NEW.name := btrim(NEW.name);

  RETURN NEW;
END;
$function$
