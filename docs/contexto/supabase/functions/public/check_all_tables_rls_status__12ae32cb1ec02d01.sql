CREATE OR REPLACE FUNCTION public.check_all_tables_rls_status()
 RETURNS TABLE(table_name text, rls_enabled boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        relname::text as table_name, 
        relrowsecurity as rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
    ORDER BY relname ASC;
END;
$function$
