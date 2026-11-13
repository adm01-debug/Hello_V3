CREATE OR REPLACE FUNCTION public.log_index_drop_copy(p_index_name text, p_table_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
  v_email TEXT;
  v_sql TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  SELECT email INTO v_email FROM public.user_profiles WHERE id = auth.uid();

  v_sql := format(
    'DROP INDEX CONCURRENTLY IF EXISTS public.%I;',
    p_index_name
  );

  INSERT INTO public.index_drop_audit (
    index_name, table_name, sql_generated, admin_id, admin_email, action
  ) VALUES (
    p_index_name, p_table_name, v_sql, auth.uid(), v_email, 'copy'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$
