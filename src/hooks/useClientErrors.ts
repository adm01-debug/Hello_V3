import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Erros nao tratados do navegador (etapa 230 / A-097).
 * Escrita: src/lib/errorReporter.ts. Leitura/resolucao: /admin/client-errors.
 */
export const CLIENT_ERRORS_QUERY_KEY = ['client-errors'] as const;

export const CLIENT_ERRORS_COLUMNS =
  'id, occurred_at, user_id, route, error_type, message, stack, correlation_id, resolved_at, resolved_by';

export const CLIENT_ERRORS_PAGE_SIZE = 25;

export interface ClientErrorEntry {
  id: string;
  occurred_at: string;
  user_id: string | null;
  route: string;
  error_type: string;
  message: string;
  stack: string | null;
  correlation_id: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export const CLIENT_ERROR_TYPE_LABEL: Record<string, string> = {
  error: 'Erro',
  'unhandled-rejection': 'Promise rejeitada',
  'react-component': 'Erro de componente',
  'network-error': 'Erro de rede',
};

export function clientErrorTypeLabel(type: string): string {
  return CLIENT_ERROR_TYPE_LABEL[type] ?? type;
}

export interface ClientErrorsFilter {
  page?: number;
  onlyOpen?: boolean;
  route?: string;
}

export interface ClientErrorsResult {
  rows: ClientErrorEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export function useClientErrors({ page = 0, onlyOpen = true, route }: ClientErrorsFilter = {}) {
  const from = page * CLIENT_ERRORS_PAGE_SIZE;
  const routeFilter = route?.trim() ?? '';

  return useQuery({
    queryKey: [...CLIENT_ERRORS_QUERY_KEY, page, onlyOpen, routeFilter],
    queryFn: async (): Promise<ClientErrorsResult> => {
      let query = supabase
        .from('client_errors')
        .select(CLIENT_ERRORS_COLUMNS, { count: 'exact' })
        .order('occurred_at', { ascending: false })
        .range(from, from + CLIENT_ERRORS_PAGE_SIZE - 1);

      if (onlyOpen) query = query.is('resolved_at', null);
      if (routeFilter.length > 0) query = query.ilike('route', `%${routeFilter}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        rows: (data ?? []) as ClientErrorEntry[],
        total: count ?? 0,
        page,
        pageSize: CLIENT_ERRORS_PAGE_SIZE,
      };
    },
  });
}

export interface ClientErrorStats {
  last24h: number;
  open: number;
}

export function useClientErrorStats() {
  return useQuery({
    queryKey: [...CLIENT_ERRORS_QUERY_KEY, 'stats'],
    queryFn: async (): Promise<ClientErrorStats> => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [recent, open] = await Promise.all([
        supabase
          .from('client_errors')
          .select('id', { count: 'exact', head: true })
          .gte('occurred_at', since),
        supabase
          .from('client_errors')
          .select('id', { count: 'exact', head: true })
          .is('resolved_at', null),
      ]);
      if (recent.error) throw recent.error;
      if (open.error) throw open.error;
      return { last24h: recent.count ?? 0, open: open.count ?? 0 };
    },
  });
}

export function useResolveClientError() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('client_errors')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: auth.user?.id ?? null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIENT_ERRORS_QUERY_KEY });
      toast.success('Erro marcado como resolvido');
    },
    onError: (error: Error) => {
      toast.error(`Nao foi possivel resolver: ${error.message}`);
    },
  });
}