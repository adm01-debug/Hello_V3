import { Card, CardContent } from '@/components/ui/card';
import { useSupervisorPanel } from '@/hooks/useSupervisorPanel';
import { ActiveCallsList } from './panel/ActiveCallsList';
import { BargeInBanner } from './panel/BargeInBanner';
import { CallActionTabs } from './panel/CallActionTabs';
import { PanelHeader } from './panel/PanelHeader';
import { QueueMetricsGrid } from './panel/QueueMetricsGrid';
import { TrendChartToggle } from './panel/TrendChartToggle';

export const SupervisorPanel = () => {
  const s = useSupervisorPanel();

  return (
    <Card className="h-full">
      <PanelHeader s={s} />
      <CardContent className="space-y-4">
        <QueueMetricsGrid metrics={s.queueMetrics} />
        <TrendChartToggle s={s} />
        <BargeInBanner s={s} />
        <ActiveCallsList s={s} />
        <CallActionTabs s={s} />
        {!s.selectedCall && s.activeCalls.length > 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Selecione uma chamada para gerenciar
          </div>
        )}
      </CardContent>
    </Card>
  );
};
