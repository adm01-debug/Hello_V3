CREATE OR REPLACE FUNCTION public.update_transcript_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('portuguese', COALESCE(NEW.full_text, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
