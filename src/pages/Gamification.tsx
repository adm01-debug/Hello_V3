import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Gamification() {
  usePageTitle('Gamificação');

  return (
    <NeonPageLayout>
      <NeonPageHeader title="Gamificação" description="Badges, ranking semanal e metas dos agentes." />
      <GamificationDashboard />
    </NeonPageLayout>
  );
}