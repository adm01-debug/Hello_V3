import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export interface KbCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface KbArticle {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  tags: string[] | null;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  author_email: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useKbCategories() {
  return useQuery({
    queryKey: ['kb-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_categories')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) {
        logger.error('useKbCategories.fetch', { error });
        throw error;
      }
      return (data ?? []) as KbCategory[];
    },
  });
}

 export function useKbArticles(params: {
   categoryId?: string;
   search?: string;
   status?: KbArticle['status'];
   useSemantic?: boolean;
 } = {}) {
   return useQuery({
     queryKey: ['kb-articles', params],
     queryFn: async () => {
       // Se for busca semântica e houver termo de busca
       if (params.useSemantic && params.search && params.search.trim().length > 2) {
         try {
           // 1. Obter embedding do termo de busca via Edge Function (que chama Lovable AI Gateway)
           const { data: embeddingData, error: embedError } = await supabase.functions.invoke('embed-kb-article', {
             body: { text: params.search } // Precisaremos ajustar a function para aceitar texto puro além de record
           });
 
           if (embedError) throw embedError;
 
           // 2. Chamar RPC match_kb_articles
           const { data, error } = await supabase.rpc('match_kb_articles', {
             query_embedding: embeddingData.embedding,
             match_threshold: 0.5,
             match_count: 20,
             filter_category_id: (params.categoryId === 'all' || !params.categoryId) ? undefined : params.categoryId
           });
 
           if (error) throw error;
           return (data ?? []) as unknown as KbArticle[];
         } catch (err) {
           logger.error('Semantic search failed, falling back to keyword search', err);
         }
       }
 
       // Fallback para busca por palavra-chave (TSVector)
       let q = supabase
         .from('kb_articles')
         .select('*')
         .order('updated_at', { ascending: false })
         .limit(200);
 
       if (params.status) q = q.eq('status', params.status);
       else q = q.eq('status', 'published');
 
       if (params.categoryId && params.categoryId !== 'all') q = q.eq('category_id', params.categoryId);
       
       if (params.search && params.search.trim().length > 1) {
         q = q.textSearch('search_vector', params.search, {
           type: 'websearch',
           config: 'portuguese',
         });
       }
 
       const { data, error } = await q;
       if (error) {
         logger.error('useKbArticles.fetch', { error });
         throw error;
       }
       return (data ?? []) as KbArticle[];
     },
   });
 }

export function useKbArticle(id: string | null) {
  return useQuery({
    queryKey: ['kb-article', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) {
        logger.error('useKbArticle.fetch', { error });
        throw error;
      }
      return data as KbArticle | null;
    },
  });
}

export function useUpsertArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (article: Partial<KbArticle> & { title: string; slug: string; content: string }) => {
      const payload = {
        ...article,
        published_at:
          article.status === 'published' && !article.published_at
            ? new Date().toISOString()
            : article.published_at,
      };
      const { data, error } = await supabase
        .from('kb_articles')
        .upsert(payload as never)
        .select()
        .single();
      if (error) throw error;
      return data as KbArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles'] });
      toast.success('Artigo salvo');
    },
    onError: (err) => {
      logger.error('useUpsertArticle.error', { err });
      toast.error('Falha ao salvar artigo');
    },
  });
}

export function useRecordKbView() {
  return useMutation({
    mutationFn: async (params: {
      articleId: string;
      conversationId?: string;
      wasHelpful?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('kb_article_views').insert({
        article_id: params.articleId,
        viewer_id: userData.user?.id ?? null,
        viewer_type: 'agent',
        conversation_id: params.conversationId ?? null,
        was_helpful: params.wasHelpful ?? null,
      });
      if (error) {
        logger.error('useRecordKbView.error', { error });
      }
    },
  });
}
