CREATE OR REPLACE FUNCTION public.handle_kb_article_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
