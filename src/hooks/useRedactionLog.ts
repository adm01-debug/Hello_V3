import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Historico de redacoes de conteudo sensivel.
 *
 * A edge `redact-sensitive-audio` grava uma linha em `redaction_log` a cada
 * execucao (supabase/functions/redact-sensitive-audio/index.ts), mas nenhuma
 * tela lia a tabela: a auditoria de LGPD/PCI existia so no banco.
 */
export const REDACTION_LOG_QUERY_KEY = ['redaction-log'] as const;

export const REDACTION_LOG_COLUMNS =
  'id, call_session_id, pattern_type, match_count, segments, status, error_message, created_at';

export const REDACTION_LOG_LIMIT = 50;

export interface RedactionLogEntry {
  id: string;
  call_session_id: string | null;
  pattern_type: string;
  match_count: number;
  segments: unknown;
  status: string;
  error_message: string | null;
  created_at: string;
}

const REDACTION_STATUS_LABEL: Record<string, string> = {
  completed: 'Concluida',
  no_matches: 'Sem ocorrencias',
  failed: 'Falhou',
};

export type RedactionStatusTone = 'success' | 'neutral' | 'danger';

export function redactionStatusLabel(status: string): string {
  return REDACTION_STATUS_LABEL[status] ?? status;
}

export function redactionStatusTone(status: string): RedactionStatusTone {
  if (status === 'completed') return 'success';
  if (status === 'no_matches') return 'neutral';
  return 'danger';
}

/** `pattern_type` vem como lista separada por virgula pela edge ('cpf,card'). */
export function redactionPatternList(patternType: string): string[] {
  return patternType
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p !== 'none');
}

export function countRedactionSegments(segments: unknown): number {
  return Array.isArray(segments) ? segments.length : 0;
}

export function useRedactionLog(limit: number = REDACTION_LOG_LIMIT) {
  return useQuery({
    queryKey: [...REDACTION_LOG_QUERY_KEY, limit],
    queryFn: async (): Promise<RedactionLogEntry[]> => {
      const { data, error } = await supabase
        .from('redaction_log')
        .select(REDACTION_LOG_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as RedactionLogEntry[];
    },
  });
}