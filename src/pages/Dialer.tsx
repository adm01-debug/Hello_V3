import { PredictiveDialerPanel } from '@/components/dialer/PredictiveDialerPanel';
import { usePageTitle } from '@/hooks/usePageTitle';

const Dialer = () => {
  usePageTitle('Discador');


  return (
    <div className="space-y-6 animate-fade-in">
      <PredictiveDialerPanel />
    </div>
  );
};

export default Dialer;
