CREATE OR REPLACE FUNCTION public.validate_ring_group()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.no_answer_action IN ('forward_extension','forward_queue') THEN
    IF NEW.forward_target IS NULL OR btrim(NEW.forward_target) = '' THEN
      RAISE EXCEPTION 'forward_target_required';
    END IF;
    IF NEW.no_answer_action = 'forward_queue'
       AND NOT EXISTS (SELECT 1 FROM public.call_queues q WHERE q.id::text = NEW.forward_target) THEN
      RAISE EXCEPTION 'forward_queue_not_found';
    END IF;
    IF NEW.no_answer_action = 'forward_extension'
       AND NEW.extension IS NOT NULL
       AND NEW.forward_target = NEW.extension THEN
      RAISE EXCEPTION 'forward_target_self_reference';
    END IF;
  ELSE
    NEW.forward_target := NULL;
  END IF;
  NEW.name := btrim(NEW.name);
  RETURN NEW;
END;
$function$
