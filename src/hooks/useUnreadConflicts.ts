import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuthContext } from '@/contexts/AuthContext';

const log = logger.create('useUnreadConflicts');

/**
 * Conta conflitos de lock otimista nas últimas 24h.
 * Apenas admin/supervisor têm acesso (gated por RLS de optimistic_lock_conflicts).
 */
export function useUnreadConflicts() {
  const { profile } = useAuthContext();
  const enabled = profile?.role === 'admin' || profile?.role === 'supervisor';

  return useQuery<number>({
    queryKey: ['unread-conflicts-24h', profile?.role ?? 'none'],
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count, error } = await supabase
        .from('optimistic_lock_conflicts')
        .select('id', { count: 'exact', head: true })
        .gte('attempted_at', since);

      if (error) {
        log.error('Falha ao contar conflitos', error);
        return 0;
      }
      return count ?? 0;
    },
  });
}
