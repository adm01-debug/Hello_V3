import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface KbArticleHistoryEntry {
  id: string;
  article_id: string;
  changed_by: string | null;
  previous_title: string | null;
  new_title: string | null;
  previous_content: string | null;
  new_content: string | null;
  change_type: string;
  created_at: string;
}

/** Prefixo da chave: o salvar artigo invalida ['kb-article-history', ...]. */
export const KB_ARTICLE_HISTORY_QUERY_KEY = ['kb-article-history'] as const;

export const KB_ARTICLE_HISTORY_LIMIT = 20;

export const KB_ARTICLE_HISTORY_COLUMNS =
  'id, article_id, changed_by, previous_title, new_title, previous_content, new_content, change_type, created_at';

export type KbHistoryTone = 'create' | 'update' | 'status' | 'neutral';

export function kbHistoryChangeLabel(changeType: string | null | undefined): string {
  switch ((changeType ?? '').toLowerCase()) {
    case 'create':
      return 'Criação';
    case 'update':
      return 'Edição';
    case 'status_change':
      return 'Mudança de status';
    case 'publish':
      return 'Publicação';
    default:
      return changeType && changeType.trim() !== '' ? changeType : 'Alteração';
  }
}

export function kbHistoryChangeTone(changeType: string | null | undefined): KbHistoryTone {
  switch ((changeType ?? '').toLowerCase()) {
    case 'create':
      return 'create';
    case 'update':
      return 'update';
    case 'status_change':
    case 'publish':
      return 'status';
    default:
      return 'neutral';
  }
}

export function kbHistoryTitleChanged(entry: KbArticleHistoryEntry): boolean {
  const before = (entry.previous_title ?? '').trim();
  const after = (entry.new_title ?? '').trim();
  return before !== '' && before !== after;
}

export function kbHistoryContentChanged(entry: KbArticleHistoryEntry): boolean {
  return (entry.previous_content ?? '') !== (entry.new_content ?? '');
}

export function kbHistoryActorLabel(changedBy: string | null | undefined): string {
  if (!changedBy) return 'por sistema';
  return `por ${changedBy.length > 8 ? `${changedBy.slice(0, 8)}...` : changedBy}`;
}

export function kbHistoryPreview(value: string | null | undefined, max = 160): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (text === '') return '';
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}

export function useKbArticleHistory(articleId: string | null, limit = KB_ARTICLE_HISTORY_LIMIT) {
  return useQuery({
    queryKey: [...KB_ARTICLE_HISTORY_QUERY_KEY, articleId, limit],
    enabled: Boolean(articleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_article_history')
        .select(KB_ARTICLE_HISTORY_COLUMNS)
        .eq('article_id', articleId as string)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) {
        logger.error('useKbArticleHistory.fetch', { error });
        throw error;
      }
      return (data ?? []) as KbArticleHistoryEntry[];
    },
  });
}