-- Trigger para gerar embedding automaticamente
CREATE OR REPLACE FUNCTION public.handle_kb_article_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar Edge Function de forma assíncrona (via net.http_post se disponível ou via webhook nativo do Supabase)
  -- Para Lovable, configuraremos via Webhook do Dashboard, mas aqui deixamos o placeholder
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Observação: O webhook real deve ser configurado no dashboard do Supabase apontando para a function embed-kb-article
