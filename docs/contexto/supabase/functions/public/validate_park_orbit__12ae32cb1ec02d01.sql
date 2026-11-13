CREATE OR REPLACE FUNCTION public.validate_park_orbit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.name := btrim(NEW.name);

  -- destino obrigatório apenas em encaminhamentos
  IF NEW.timeout_action IN ('ring_group','queue','extension') THEN
    IF NEW.timeout_target IS NULL OR btrim(NEW.timeout_target) = '' THEN
      RAISE EXCEPTION 'Destino obrigatório para a ação de tempo esgotado "%"', NEW.timeout_action;
    END IF;
    NEW.timeout_target := btrim(NEW.timeout_target);
  ELSE
    NEW.timeout_target := NULL;
  END IF;

  -- faixas de órbitas ativas não podem se sobrepor
  IF NEW.is_active THEN
    IF EXISTS (
      SELECT 1 FROM public.call_park_orbits o
      WHERE o.id <> NEW.id
        AND o.is_active
        AND NEW.slot_start <= o.slot_end
        AND NEW.slot_end >= o.slot_start
    ) THEN
      RAISE EXCEPTION 'A faixa de vagas %-% se sobrepõe a outra órbita ativa', NEW.slot_start, NEW.slot_end;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
