-- Tabela de histórico de versões da Base de Conhecimento
CREATE TABLE IF NOT EXISTS public.kb_article_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.kb_articles(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    previous_content TEXT,
    new_content TEXT,
    previous_title TEXT,
    new_title TEXT,
    change_type TEXT NOT NULL, -- 'update', 'status_change', 'publish'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para histórico
ALTER TABLE public.kb_article_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apenas admin e supervisor veem historico" ON public.kb_article_history FOR SELECT USING (is_admin_or_supervisor());

-- Trigger para registrar mudanças
CREATE OR REPLACE FUNCTION public.handle_kb_article_history()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.kb_article_history (
            article_id,
            changed_by,
            previous_content,
            new_content,
            previous_title,
            new_title,
            change_type
        ) VALUES (
            NEW.id,
            current_user_id,
            OLD.content,
            NEW.content,
            OLD.title,
            NEW.title,
            CASE 
                WHEN OLD.status <> NEW.status THEN 'status_change'
                ELSE 'update'
            END
        );
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.kb_article_history (
            article_id,
            changed_by,
            new_content,
            new_title,
            change_type
        ) VALUES (
            NEW.id,
            current_user_id,
            NEW.content,
            NEW.title,
            'create'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER kb_article_history_trigger
AFTER INSERT OR UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.handle_kb_article_history();
