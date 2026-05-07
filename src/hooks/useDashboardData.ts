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
       if (error) {
         console.error('Error fetching dashboard stats:', error);
         throw new Error('Falha ao carregar estatísticas do dashboard');
       }
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
       if (error) {
         console.error('Error fetching agents list:', error);
         throw new Error('Falha ao carregar lista de agentes');
       }
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
       const now = new Date();
       const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
 
       const { data, error } = await supabase
         .from('call_sessions')
         .select('started_at, direction' as any)
         .gte('started_at', twentyFourHoursAgo.toISOString());
 
       if (error) throw error;
 
       const hourMap: Record<string, { incoming: number; outgoing: number }> = {};
       
       // Initialize all 24 hours
       for (let i = 0; i < 24; i++) {
         const d = new Date(now.getTime() - i * 60 * 60 * 1000);
         const hour = d.getHours();
         const key = `${hour.toString().padStart(2, '0')}:00`;
         hourMap[key] = { incoming: 0, outgoing: 0 };
       }
 
       for (const call of (data as any) || []) {
         const date = new Date(call.started_at);
         const hour = date.getHours();
         const key = `${hour.toString().padStart(2, '0')}:00`;
         if (hourMap[key]) {
           if (call.direction === 'outbound') {
             hourMap[key].outgoing += 1;
           } else {
             hourMap[key].incoming += 1;
           }
         }
       }
 
       return Object.entries(hourMap)
         .map(([hour, counts]) => ({ hour, ...counts }))
         .sort((a, b) => a.hour.localeCompare(b.hour));
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
