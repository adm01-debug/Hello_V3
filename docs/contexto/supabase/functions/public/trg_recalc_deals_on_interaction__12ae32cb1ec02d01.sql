CREATE OR REPLACE FUNCTION public.trg_recalc_deals_on_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal_id UUID;
BEGIN
  FOR v_deal_id IN
    SELECT id FROM public.deals
    WHERE contact_id = NEW.contact_id AND status = 'open'
  LOOP
    PERFORM public.recalc_deal_health(v_deal_id);
  END LOOP;
  RETURN NEW;
END;
$function$
