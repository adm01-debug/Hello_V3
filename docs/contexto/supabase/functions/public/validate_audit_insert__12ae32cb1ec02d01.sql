CREATE OR REPLACE FUNCTION public.validate_audit_insert()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Apenas permite inserção via função log_audit_event (contexto de security definer)
  -- ou usuários autenticados (que usam a função RPC)
  RETURN auth.uid() IS NOT NULL;
END;
$function$
