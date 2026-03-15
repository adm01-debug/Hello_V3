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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayISO = yesterday.toISOString();

      // Today's calls
      const { count: todayCalls } = await supabase
        .from('call_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', todayISO);

      // Yesterday's calls
      const { count: yesterdayCalls } = await supabase
        .from('call_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', yesterdayISO)
        .lt('started_at', todayISO);

      // Today's completed calls with duration
      const { data: todayCompleted } = await supabase
        .from('call_sessions')
        .select('duration_seconds, status')
        .gte('started_at', todayISO)
        .not('duration_seconds', 'is', null);

      const completedCalls = todayCompleted?.filter(c => c.status === 'completed') || [];
      const avgDuration = completedCalls.length > 0
        ? Math.round(completedCalls.reduce((s, c) => s + (c.duration_seconds || 0), 0) / completedCalls.length)
        : 0;

      const answeredRate = (todayCalls || 0) > 0
        ? Math.round((completedCalls.length / (todayCalls || 1)) * 100)
        : 0;

      // Agents
      const { data: agents } = await supabase.from('agents').select('status');
      const totalAgents = agents?.length || 0;
      const activeAgents = agents?.filter(a => a.status === 'available' || a.status === 'busy').length || 0;

      const tc = todayCalls || 0;
      const yc = yesterdayCalls || 0;
      const change = yc > 0 ? Math.round(((tc - yc) / yc) * 100) : 0;

      return {
        totalCallsToday: tc,
        totalCallsChange: change,
        avgCallDuration: avgDuration,
        durationChange: 0,
        answeredRate,
        rateChange: 0,
        activeAgents,
        totalAgents,
      };
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
      // Get active calls waiting
      const { count: waiting } = await supabase
        .from('call_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ringing');

      // Get hold events for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: holdEvents } = await supabase
        .from('hold_events')
        .select('duration_seconds')
        .gte('started_at', today.toISOString());

      const durations = (holdEvents || []).map(e => e.duration_seconds || 0).filter(d => d > 0);
      const avgWaitTime = durations.length > 0
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : 0;
      const longestWait = durations.length > 0 ? Math.max(...durations) : 0;

      // Get abandoned calls today
      const { count: abandoned } = await supabase
        .from('call_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', today.toISOString())
        .eq('status', 'abandoned');

      // Calculate service level
      const { count: totalToday } = await supabase
        .from('call_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', today.toISOString());

      const { count: completedToday } = await supabase
        .from('call_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', today.toISOString())
        .eq('status', 'completed');

      const serviceLevelPercent = (totalToday || 0) > 0
        ? Math.round(((completedToday || 0) / (totalToday || 1)) * 100)
        : 100;

      return {
        waiting: waiting || 0,
        avgWaitTime,
        longestWait,
        abandoned: abandoned || 0,
        serviceLevelPercent,
      };
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
