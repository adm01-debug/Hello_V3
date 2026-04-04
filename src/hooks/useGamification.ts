import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  requirement_type: string;
  requirement_value: number;
}

export interface AgentBadge {
  id: string;
  agent_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface AgentWeeklyStats {
  id: string;
  agent_id: string;
  week_start: string;
  total_calls: number;
  total_duration_seconds: number;
  avg_satisfaction: number;
  avg_performance: number;
  badges_earned: number;
  points_earned: number;
}

export interface RankingEntry {
  agent_id: string;
  agent_name: string;
  avatar_url: string | null;
  total_calls: number;
  total_duration_seconds: number;
  avg_satisfaction: number;
  points_earned: number;
  badges_earned: number;
  rank: number;
}

export function useGamification(agentId?: string) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [agentBadges, setAgentBadges] = useState<AgentBadge[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<AgentWeeklyStats | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('tier', { ascending: true })
      .order('points', { ascending: true });

    if (error) {
      console.error('Error fetching badges:', error);
      return;
    }

    setBadges(data as Badge[]);
  };

  const fetchAgentBadges = async () => {
    if (!agentId) return;

    const { data, error } = await supabase
      .from('agent_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('agent_id', agentId)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching agent badges:', error);
      return;
    }

    setAgentBadges(data.map((ab: Record<string, unknown>) => ({
      ...ab,
      badge: ab.badge as Badge
    })));
  };

  const fetchWeeklyStats = async () => {
    if (!agentId) return;

    const weekStart = getWeekStart();

    const { data, error } = await supabase
      .from('agent_weekly_stats')
      .select('*')
      .eq('agent_id', agentId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (error) {
      console.error('Error fetching weekly stats:', error);
      return;
    }

    setWeeklyStats(data as AgentWeeklyStats | null);
  };

  const fetchRankings = async () => {
    const weekStart = getWeekStart();

    const { data: stats, error: statsError } = await supabase
      .from('agent_weekly_stats')
      .select('*')
      .eq('week_start', weekStart)
      .order('points_earned', { ascending: false });

    if (statsError) {
      console.error('Error fetching rankings:', statsError);
      return;
    }

    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, avatar_url');

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return;
    }

    const agentsMap = new Map(agents.map(a => [a.id, a]));

    const rankingData: RankingEntry[] = (stats || []).map((stat, index) => {
      const agent = agentsMap.get(stat.agent_id);
      return {
        agent_id: stat.agent_id,
        agent_name: agent?.name || 'Agente',
        avatar_url: agent?.avatar_url ?? null,
        total_calls: stat.total_calls,
        total_duration_seconds: stat.total_duration_seconds,
        avg_satisfaction: stat.avg_satisfaction,
        points_earned: stat.points_earned,
        badges_earned: stat.badges_earned,
        rank: index + 1
      };
    });

    setRankings(rankingData);
  };

  const awardBadge = async (badgeId: string) => {
    if (!agentId) return;

    const { data, error } = await supabase
      .from('agent_badges')
      .insert({
        agent_id: agentId,
        badge_id: badgeId
      })
      .select(`
        *,
        badge:badges(*)
      `)
      .single();

    if (error) {
      if (error.code === '23505') return; // Already has badge
      console.error('Error awarding badge:', error);
      return;
    }

    const badge = (data as Record<string, unknown>).badge as Badge;
    toast.success('🏆 Nova Conquista!', { description: `Você ganhou a badge "${badge.name}"!` });

    fetchAgentBadges();
    updateWeeklyStats({ badges_earned: 1, points_earned: badge.points });
  };

  const updateWeeklyStats = async (updates: Partial<{
    total_calls: number;
    total_duration_seconds: number;
    avg_satisfaction: number;
    avg_performance: number;
    badges_earned: number;
    points_earned: number;
  }>) => {
    if (!agentId) return;

    const weekStart = getWeekStart();

    const { data: existing } = await supabase
      .from('agent_weekly_stats')
      .select('*')
      .eq('agent_id', agentId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (existing) {
      const newValues: Record<string, number> = {};
      if (updates.total_calls) newValues.total_calls = existing.total_calls + updates.total_calls;
      if (updates.total_duration_seconds) newValues.total_duration_seconds = existing.total_duration_seconds + updates.total_duration_seconds;
      if (updates.badges_earned) newValues.badges_earned = existing.badges_earned + updates.badges_earned;
      if (updates.points_earned) newValues.points_earned = existing.points_earned + updates.points_earned;
      if (updates.avg_satisfaction) newValues.avg_satisfaction = updates.avg_satisfaction;
      if (updates.avg_performance) newValues.avg_performance = updates.avg_performance;

      await supabase
        .from('agent_weekly_stats')
        .update(newValues)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('agent_weekly_stats')
        .insert({
          agent_id: agentId,
          week_start: weekStart,
          ...updates
        });
    }

    fetchWeeklyStats();
    fetchRankings();
  };

  const checkAndAwardBadges = async (stats: {
    totalCalls: number;
    avgSatisfaction: number;
    weeklyDuration: number;
    dailyCalls: number;
    weeklyRank: number;
  }) => {
    for (const badge of badges) {
      const hasEarned = agentBadges.some(ab => ab.badge_id === badge.id);
      if (hasEarned) continue;

      let earned = false;
      switch (badge.requirement_type) {
        case 'total_calls':
          earned = stats.totalCalls >= badge.requirement_value;
          break;
        case 'avg_satisfaction':
          earned = stats.avgSatisfaction * 10 >= badge.requirement_value;
          break;
        case 'weekly_duration':
          earned = stats.weeklyDuration >= badge.requirement_value;
          break;
        case 'daily_calls':
          earned = stats.dailyCalls >= badge.requirement_value;
          break;
        case 'weekly_rank':
          earned = stats.weeklyRank > 0 && stats.weeklyRank <= badge.requirement_value;
          break;
      }

      if (earned) {
        await awardBadge(badge.id);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchBadges();
      await fetchAgentBadges();
      await fetchWeeklyStats();
      await fetchRankings();
      setIsLoading(false);
    };

    loadData();
  }, [agentId]);

  return {
    badges,
    agentBadges,
    weeklyStats,
    rankings,
    isLoading,
    awardBadge,
    updateWeeklyStats,
    checkAndAwardBadges,
    refetch: () => {
      fetchBadges();
      fetchAgentBadges();
      fetchWeeklyStats();
      fetchRankings();
    }
  };
}
