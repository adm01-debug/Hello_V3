import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Info, Timer } from 'lucide-react';
import type { QueueMetricsSettings, UpdateSetting } from './types';

interface Props {
  settings: QueueMetricsSettings;
  updateSetting: UpdateSetting;
}

export const CheckIntervalCard = ({ settings, updateSetting }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Timer className="h-5 w-5" />
        Intervalo de Verificação
      </CardTitle>
      <CardDescription>Com que frequência as métricas são verificadas</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-4">
        <Slider
          value={[settings.check_interval_minutes]}
          onValueChange={([value]) => updateSetting('check_interval_minutes', value)}
          min={1}
          max={30}
          step={1}
          className="flex-1"
        />
        <div className="w-24 text-right">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {settings.check_interval_minutes} min
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        <Info className="h-4 w-4" />
        As métricas são verificadas a cada {settings.check_interval_minutes} minutos
      </p>
    </CardContent>
  </Card>
);
