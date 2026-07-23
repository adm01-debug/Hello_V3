import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart3, ChevronDown } from 'lucide-react';
import { QueueTrendChart } from '../QueueTrendChart';
import type { SupervisorPanelState } from './types';

export function TrendChartToggle({ s }: { s: SupervisorPanelState }) {
  return (
    <Collapsible open={s.showTrendChart} onOpenChange={s.setShowTrendChart}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />Tendência do Dia
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${s.showTrendChart ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <QueueTrendChart />
      </CollapsibleContent>
    </Collapsible>
  );
}
