CREATE OR REPLACE FUNCTION public.update_virtual_fax_ocr_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.ocr_search_vector := to_tsvector('portuguese', COALESCE(NEW.ocr_text, '') || ' ' || COALESCE(NEW.subject, ''));
  RETURN NEW;
END;
$function$
