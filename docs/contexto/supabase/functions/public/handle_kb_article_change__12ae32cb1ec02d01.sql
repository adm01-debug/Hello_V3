CREATE OR REPLACE FUNCTION public.handle_kb_article_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Chamar Edge Function de forma assíncrona (via net.http_post se disponível ou via webhook nativo do Supabase)
  -- Para Lovable, configuraremos via Webhook do Dashboard, mas aqui deixamos o placeholder
  RETURN NEW;
END;
$function$
