import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { AchievementCelebration } from '@/components/gamification/AchievementCelebration';
import { useAgentStatus } from '@/hooks/useAgentStatus';

interface AchievementNotificationProviderProps {
  children: React.ReactNode;
}

export function AchievementNotificationProvider({ children }: AchievementNotificationProviderProps) {
  const { currentAgent } = useAgentStatus();
  const { latestAchievement, clearLatestAchievement } = useAchievementNotifications(currentAgent?.id);

  return (
    <>
      {children}
      
      {latestAchievement && (
        <AchievementCelebration
          badge={latestAchievement.badge}
          agentName={latestAchievement.agentName}
          onClose={clearLatestAchievement}
        />
      )}
    </>
  );
}
