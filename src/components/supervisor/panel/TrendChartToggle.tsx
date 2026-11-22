import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart3, ChevronDown } from 'lucide-react';
import { QueueTrendChart } from '../QueueTrendChart';
import type { SupervisorPanelState } from './types';

export function TrendChartToggle({ s }: { s: SupervisorPanelState }) {
  // Monta o gráfico a partir do primeiro clique e nunca mais desmonta, para o
  // histórico de 20 pontos sobreviver a cada toggle. Antes o CollapsibleContent
  // desmontava o filho ao fechar e a série recomeçava do zero, levando ~100s
  // (20 x polling de 5s) para reaparecer. Só monta depois que o usuário abre:
  // o hook do gráfico abre canal realtime e faz polling de 5s enquanto estiver
  // montado, então montar desde o início cobraria esse custo de quem nunca
  // abriu a tendência.
  const [everOpened, setEverOpened] = useState(s.showTrendChart);

  return (
    <Collapsible
      open={s.showTrendChart}
      onOpenChange={(open) => {
        if (open) setEverOpened(true);
        s.setShowTrendChart(open);
      }}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />Tendência do Dia
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${s.showTrendChart ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent forceMount className="pt-2 data-[state=closed]:hidden">
        {everOpened && <QueueTrendChart />}
      </CollapsibleContent>
    </Collapsible>
  );
}
