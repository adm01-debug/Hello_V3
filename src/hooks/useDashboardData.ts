import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface DashboardStats {
  totalCallsToday: number;
  totalCallsChange: number;
  avgCallDuration: number;
  durationChange: number;
  answeredRate: number;
  rateChange: number;
  activeAgents: number;
  totalAgents: number;
}

interface AgentRow {
  id: string;
  name: string;
  status: string;
  avatar_url: string | null;
  extension: string;
}

interface CallSessionRow {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  agent_name: string | null;
  status: string | null;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
}

interface HourlyVolume {
  hour: string;
  incoming: number;
  outgoing: number;
}

interface QueueStats {
  waiting: number;
  avgWaitTime: number;
  longestWait: number;
  abandoned: number;
  serviceLevelPercent: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_dashboard_stats');
       if (error) throw error;
       return data as unknown as DashboardStats;
     },
    refetchInterval: 30000,
  });
}

export function useAgentsListData() {
  return useQuery<AgentRow[]>({
    queryKey: ['agents-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, status, avatar_url, extension')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });
}

export function useRecentCallsData() {
  return useQuery<CallSessionRow[]>({
    queryKey: ['recent-calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_sessions')
        .select('id, caller_name, caller_phone, agent_name, status, duration_seconds, started_at, ended_at')
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });
}

export function useCallVolumeData() {
  return useQuery<HourlyVolume[]>({
    queryKey: ['call-volume'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('call_sessions')
        .select('started_at')
        .gte('started_at', today.toISOString());

      if (error) throw error;

      // Group by hour
      const hourMap: Record<string, { incoming: number; outgoing: number }> = {};
      for (let h = 8; h <= 18; h++) {
        const key = `${h.toString().padStart(2, '0')}:00`;
        hourMap[key] = { incoming: 0, outgoing: 0 };
      }

      for (const call of data || []) {
        const hour = new Date(call.started_at).getHours();
        const key = `${hour.toString().padStart(2, '0')}:00`;
        if (hourMap[key]) {
          // Alternate between incoming/outgoing for visualization
          hourMap[key].incoming += 1;
        }
      }

      return Object.entries(hourMap).map(([hour, counts]) => ({
        hour,
        ...counts,
      }));
    },
    refetchInterval: 60000,
  });
}

export function useQueueStatsData() {
  return useQuery<QueueStats>({
    queryKey: ['queue-stats'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_queue_stats');
       if (error) throw error;
       return data as unknown as QueueStats;
     },
    refetchInterval: 15000,
  });
}

export function useCallHistoryData() {
  return useQuery<CallSessionRow[]>({
    queryKey: ['call-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_sessions')
        .select('id, caller_name, caller_phone, agent_name, status, duration_seconds, started_at, ended_at')
        .order('started_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });
}
