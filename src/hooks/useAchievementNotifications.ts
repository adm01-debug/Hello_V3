import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/hooks/useGamification';

interface BadgeNotification {
  id: string;
  badge: Badge;
  agentName: string;
  earnedAt: string;
}

export function useAchievementNotifications(agentId?: string) {
  const [notifications, setNotifications] = useState<BadgeNotification[]>([]);
  const [latestAchievement, setLatestAchievement] = useState<BadgeNotification | null>(null);
  

  const showAchievementToast = useCallback((badge: Badge, agentName: string) => {
    toast.success('🏆 Nova Conquista!', { description: `${agentName} ganhou a badge "${badge.name}"! (+${badge.points} pts)`, duration: 5000 });
  }, [toast]);

  useEffect(() => {
    // Subscribe to new badge awards
    const channel = supabase
      .channel('badge-achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_badges',
        },
        async (payload) => {
          console.log('New badge awarded:', payload);
          
          const newBadge = payload.new as { id: string; agent_id: string; badge_id: string; earned_at: string };
          
          // Fetch badge details
          const { data: badge } = await supabase
            .from('badges')
            .select('*')
            .eq('id', newBadge.badge_id)
            .maybeSingle();

          // Fetch agent details
          const { data: agent } = await supabase
            .from('agents')
            .select('name')
            .eq('id', newBadge.agent_id)
            .maybeSingle();

          if (badge && agent) {
            const notification: BadgeNotification = {
              id: newBadge.id,
              badge: badge as Badge,
              agentName: agent.name,
              earnedAt: newBadge.earned_at,
            };

            setNotifications(prev => [notification, ...prev]);
            setLatestAchievement(notification);
            
            // Show toast for all users or just the specific agent
            if (!agentId || newBadge.agent_id === agentId) {
              showAchievementToast(badge as Badge, agent.name);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, showAchievementToast]);

  // Subscribe to goal achievements via call_alerts
  useEffect(() => {
    const channel = supabase
      .channel('goal-achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_alerts',
          filter: 'alert_type=eq.goals_achieved',
        },
        (payload) => {
          console.log('Goal achieved:', payload);
          const alert = payload.new as { title: string; message: string };
          
          toast.success('🎯 Meta Atingida!', { description: alert.title, duration: 6000 });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const clearLatestAchievement = useCallback(() => {
    setLatestAchievement(null);
  }, []);

  return {
    notifications,
    latestAchievement,
    clearLatestAchievement,
  };
}
