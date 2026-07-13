import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { logger } from '@/lib/logger';

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
   return useQuery<DashboardStats>({
     queryKey: ['dashboard-stats'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_dashboard_stats');
        if (error) {
          console.error('Error fetching dashboard stats:', error);
          throw error;
        }
       return data as unknown as DashboardStats;
     },
     refetchInterval: 15000, // Faster refresh for real-time feel
   });
 }

 export function useAgentsListData() {
   return useQuery<(AgentRow & { active_call_started_at?: string; active_call_caller?: string })[]>({
     queryKey: ['agents-list'],
     queryFn: async () => {
       const { data, error } = await supabase.rpc('get_agents_with_active_calls');
        if (error) {
          console.error('Error fetching agents list:', error);
          throw error;
        }
       return (data as unknown as (AgentRow & { active_call_started_at?: string; active_call_caller?: string })[]) || [];
     },
     refetchInterval: 10000,
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
       const { data, error } = await supabase.rpc('get_call_volume_stats');
       if (error) throw error;
       return data as unknown as HourlyVolume[];
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

