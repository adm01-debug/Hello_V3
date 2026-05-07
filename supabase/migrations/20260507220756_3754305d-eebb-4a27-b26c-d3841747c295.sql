-- Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Adicionar coluna de embedding (1536 dimensões para modelos OpenAI/Gemini padrão)
ALTER TABLE public.kb_articles 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Criar índice para busca vetorial rápida
CREATE INDEX IF NOT EXISTS kb_articles_embedding_idx ON public.kb_articles 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Função RPC para busca semântica
CREATE OR REPLACE FUNCTION public.match_kb_articles (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category_id uuid,
  title text,
  slug text,
  content text,
  excerpt text,
  tags text[],
  status text,
  view_count int,
  helpful_count int,
  updated_at timestamp with time zone,
  similarity float
)
LANGUAGE plpgsql
AS $$
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
$$;
