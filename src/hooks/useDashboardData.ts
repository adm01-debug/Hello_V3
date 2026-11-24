import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { usePageVisibility } from '@/hooks/usePageVisibility';

const dashboardLog = logger.create('useDashboardData');

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
   const isVisible = usePageVisibility();
   return useQuery<DashboardStats>({
     queryKey: ['dashboard-stats'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_dashboard_stats');
        if (error) {
          dashboardLog.error('fetch stats failed', error);
          throw error;
        }
       return data as unknown as DashboardStats;
     },
     refetchInterval: isVisible ? 15000 : false, // Faster refresh for real-time feel
   });
 }

 export function useAgentsListData() {
   const isVisible = usePageVisibility();
   return useQuery<(AgentRow & { active_call_started_at?: string; active_call_caller?: string })[]>({
     queryKey: ['agents-list'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_agents_with_active_calls');
        if (error) {
          dashboardLog.error('fetch agents failed', error);
          throw error;
        }
       return (data as unknown as (AgentRow & { active_call_started_at?: string; active_call_caller?: string })[]) || [];
     },
     refetchInterval: isVisible ? 10000 : false,
   });
 }

export function useRecentCallsData() {
  const isVisible = usePageVisibility();
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
    refetchInterval: isVisible ? 15000 : false,
  });
}

 export function useCallVolumeData() {
   const isVisible = usePageVisibility();
   return useQuery<HourlyVolume[]>({
     queryKey: ['call-volume'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_call_volume_stats');
       if (error) throw error;
       return data as unknown as HourlyVolume[];
     },
     refetchInterval: isVisible ? 60000 : false,
   });
 }

export function useQueueStatsData() {
  const isVisible = usePageVisibility();
  return useQuery<QueueStats>({
    queryKey: ['queue-stats'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_queue_stats');
       if (error) throw error;
       return data as unknown as QueueStats;
     },
    refetchInterval: isVisible ? 15000 : false,
  });
}

