CREATE OR REPLACE FUNCTION public.token_cron_valido(p_nome text, p_token text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT p_token IS NOT NULL
     AND length(p_token) >= 32
     AND EXISTS (
           SELECT 1
             FROM vault.decrypted_secrets s
            WHERE s.name = p_nome
              AND s.decrypted_secret = p_token
         );
$function$
