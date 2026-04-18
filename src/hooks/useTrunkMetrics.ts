import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrunkMetricRow {
  trunk_id: string;
  trunk_name: string;
  total_calls: number;
  total_minutes: number;
  failover_calls: number;
  failover_rate: number; // 0..1
}

export interface DailyTrunkUsage {
  date: string; // YYYY-MM-DD
  trunk_id: string;
  trunk_name: string;
  calls: number;
  minutes: number;
}

interface UsageRow {
  trunk_id: string;
  duration_seconds: number | null;
  was_failover: boolean;
  started_at: string;
}

/**
 * Métricas agregadas de uso por trunk nos últimos N dias.
 */
export function useTrunkMetrics(days = 7) {
  return useQuery({
    queryKey: ['trunk-metrics', days],
    queryFn: async (): Promise<{ summary: TrunkMetricRow[]; daily: DailyTrunkUsage[] }> => {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

      const [usageRes, trunksRes] = await Promise.all([
        supabase
          .from('voip_trunk_usage_metrics')
          .select('trunk_id, duration_seconds, was_failover, started_at')
          .gte('started_at', since),
        supabase.from('voip_trunks').select('id, name'),
      ]);

      if (usageRes.error) throw usageRes.error;
      if (trunksRes.error) throw trunksRes.error;

      const nameById = new Map<string, string>(
        (trunksRes.data ?? []).map(t => [t.id as string, t.name as string]),
      );

      const usage = (usageRes.data ?? []) as UsageRow[];

      // Agrega por trunk
      const summaryMap = new Map<string, TrunkMetricRow>();
      for (const r of usage) {
        const existing = summaryMap.get(r.trunk_id) ?? {
          trunk_id: r.trunk_id,
          trunk_name: nameById.get(r.trunk_id) ?? '—',
          total_calls: 0,
          total_minutes: 0,
          failover_calls: 0,
          failover_rate: 0,
        };
        existing.total_calls += 1;
        existing.total_minutes += Math.round((r.duration_seconds ?? 0) / 60);
        if (r.was_failover) existing.failover_calls += 1;
        summaryMap.set(r.trunk_id, existing);
      }
      const summary = Array.from(summaryMap.values()).map(s => ({
        ...s,
        failover_rate: s.total_calls > 0 ? s.failover_calls / s.total_calls : 0,
      })).sort((a, b) => b.total_calls - a.total_calls);

      // Agrega por dia × trunk
      const dailyMap = new Map<string, DailyTrunkUsage>();
      for (const r of usage) {
        const day = r.started_at.slice(0, 10);
        const key = `${day}|${r.trunk_id}`;
        const existing = dailyMap.get(key) ?? {
          date: day,
          trunk_id: r.trunk_id,
          trunk_name: nameById.get(r.trunk_id) ?? '—',
          calls: 0,
          minutes: 0,
        };
        existing.calls += 1;
        existing.minutes += Math.round((r.duration_seconds ?? 0) / 60);
        dailyMap.set(key, existing);
      }
      const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      return { summary, daily };
    },
    staleTime: 2 * 60 * 1000,
  });
}
