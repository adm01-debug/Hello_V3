CREATE OR REPLACE FUNCTION public.match_kb_articles(query_embedding vector, match_threshold double precision, match_count integer, filter_category_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, category_id uuid, title text, slug text, content text, excerpt text, tags text[], status text, view_count integer, helpful_count integer, updated_at timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.category_id,
    kb.title,
    kb.slug,
    kb.content,
    kb.excerpt,
    kb.tags,
    kb.status,
    kb.view_count,
    kb.helpful_count,
    kb.updated_at,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM kb_articles kb
  WHERE 
    (kb.status = 'published') AND
    (1 - (kb.embedding <=> query_embedding) > match_threshold) AND
    (filter_category_id IS NULL OR kb.category_id = filter_category_id)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
