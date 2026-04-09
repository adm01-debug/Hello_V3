import { CoachingPanel } from '@/components/coaching/CoachingPanel';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Coaching() {
  usePageTitle('Coaching IA');

  return (
    <div className="container mx-auto p-6">
      <CoachingPanel />
    </div>
  );
}
