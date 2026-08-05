import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Timer, TrendingDown } from 'lucide-react';
import type { QueueMetricsSettings } from './types';

interface Props {
  settings: QueueMetricsSettings;
}

export const SummaryCard = ({ settings }: Props) => (
  <Card className="bg-muted/30">
    <CardHeader>
      <CardTitle className="text-lg">Resumo das Configurações</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="space-y-2">
          <p className="font-medium flex items-center gap-2">
            <Timer className="h-4 w-4" /> Tempo de Espera
          </p>
          <p className="text-muted-foreground">
            Warning: &gt;{settings.avg_wait_time_warning}s | Critical: &gt;
            {settings.avg_wait_time_critical}s
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Taxa de Abandono
          </p>
          <p className="text-muted-foreground">
            Warning: &gt;{settings.abandonment_rate_warning}% | Critical: &gt;
            {settings.abandonment_rate_critical}%
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" /> Nível de Serviço
          </p>
          <p className="text-muted-foreground">
            Warning: &lt;{settings.service_level_warning}% | Critical: &lt;
            {settings.service_level_critical}%
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
