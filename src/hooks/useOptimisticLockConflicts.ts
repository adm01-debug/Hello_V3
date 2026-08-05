import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('useOptimisticLockConflicts');

export type ConflictPeriod = '24h' | '7d' | '30d';

export interface OptimisticLockConflict {
  id: string;
  table_name: string;
  record_id: string;
  user_id: string | null;
  client_version: number | null;
  current_version: number | null;
  attempted_at: string;
}

export interface ConflictStats {
  total: number;
  topTables: Array<{ table_name: string; count: number }>;
  topUsers: Array<{ user_id: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
  recent: OptimisticLockConflict[];
}

const periodToHours = (p: ConflictPeriod): number => {
  if (p === '24h') return 24;
  if (p === '7d') return 24 * 7;
  return 24 * 30;
};

export function useOptimisticLockConflicts(period: ConflictPeriod = '24h', tableFilter?: string) {
  return useQuery<ConflictStats>({
    queryKey: ['optimistic-lock-conflicts', period, tableFilter ?? 'all'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const since = new Date(Date.now() - periodToHours(period) * 3600 * 1000).toISOString();

      let query = supabase
        .from('optimistic_lock_conflicts')
        .select('*')
        .gte('attempted_at', since)
        .order('attempted_at', { ascending: false })
        .limit(1000);

      if (tableFilter && tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      const { data, error } = await query;
      if (error) {
        log.error('Falha ao buscar conflitos', error);
        throw error;
      }

      const rows = (data ?? []) as OptimisticLockConflict[];

      const tableCounts = new Map<string, number>();
      const userCounts = new Map<string, number>();
      const dayCounts = new Map<string, number>();

      for (const r of rows) {
        tableCounts.set(r.table_name, (tableCounts.get(r.table_name) ?? 0) + 1);
        if (r.user_id) {
          userCounts.set(r.user_id, (userCounts.get(r.user_id) ?? 0) + 1);
        }
        const day = r.attempted_at.slice(0, 10);
        dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
      }

      const topTables = Array.from(tableCounts.entries())
        .map(([table_name, count]) => ({ table_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topUsers = Array.from(userCounts.entries())
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const timeline = Array.from(dayCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total: rows.length,
        topTables,
        topUsers,
        timeline,
        recent: rows.slice(0, 50),
      };
    },
  });
}
