CREATE OR REPLACE FUNCTION public.edge_function_url(p_slug text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_base text;
BEGIN
  SELECT decrypted_secret INTO v_base
    FROM vault.decrypted_secrets
   WHERE name = 'edge_functions_base_url';

  IF v_base IS NULL OR v_base = '' THEN
    RAISE EXCEPTION 'segredo edge_functions_base_url ausente no Vault';
  END IF;

  RETURN rtrim(v_base, '/') || '/' || ltrim(p_slug, '/');
END;
$function$
