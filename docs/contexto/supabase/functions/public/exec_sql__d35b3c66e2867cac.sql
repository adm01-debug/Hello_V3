CREATE OR REPLACE FUNCTION public.exec_sql(query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  EXECUTE 'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (' || query || ') t'
    INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  EXECUTE query;
  RETURN '[]'::jsonb;
END;
$function$
