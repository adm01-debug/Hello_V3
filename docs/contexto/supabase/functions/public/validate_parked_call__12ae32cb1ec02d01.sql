CREATE OR REPLACE FUNCTION public.validate_parked_call()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start INTEGER;
  v_end INTEGER;
  v_active BOOLEAN;
BEGIN
  SELECT slot_start, slot_end, is_active INTO v_start, v_end, v_active
  FROM public.call_park_orbits WHERE id = NEW.orbit_id;

  IF v_start IS NULL THEN
    RAISE EXCEPTION 'Órbita de estacionamento inexistente';
  END IF;

  IF TG_OP = 'INSERT' AND NOT v_active THEN
    RAISE EXCEPTION 'Não é possível estacionar em uma órbita desativada';
  END IF;

  IF NEW.slot_number < v_start OR NEW.slot_number > v_end THEN
    RAISE EXCEPTION 'Vaga % fora da faixa da órbita (%-%)', NEW.slot_number, v_start, v_end;
  END IF;

  IF NEW.status <> 'parked' AND NEW.retrieved_at IS NULL THEN
    NEW.retrieved_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
