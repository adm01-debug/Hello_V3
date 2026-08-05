import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';
import { safeParseInt } from '@/lib/safe-number';
import type { QueueMetricsSettings, UpdateSetting } from './types';

interface Props {
  settings: QueueMetricsSettings;
  updateSetting: UpdateSetting;
}

export const WaitTimeThresholdCard = ({ settings, updateSetting }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Timer className="h-5 w-5 text-primary" />
        Tempo Médio de Espera
      </CardTitle>
      <CardDescription>
        Configure os limites para alertas de tempo de espera (em segundos)
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
              Warning
            </Badge>
            Threshold de Aviso
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={settings.avg_wait_time_warning}
              onChange={(e) =>
                updateSetting('avg_wait_time_warning', safeParseInt(e.target.value, { min: 0 }))
              }
              min={0}
              max={300}
              className="w-32"
            />
            <span className="text-muted-foreground">segundos</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Alerta quando tempo médio &gt; {settings.avg_wait_time_warning}s
          </p>
        </div>
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Badge variant="destructive">Critical</Badge>
            Threshold Crítico
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={settings.avg_wait_time_critical}
              onChange={(e) =>
                updateSetting('avg_wait_time_critical', safeParseInt(e.target.value, { min: 0 }))
              }
              min={0}
              max={600}
              className="w-32"
            />
            <span className="text-muted-foreground">segundos</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Alerta crítico quando tempo médio &gt; {settings.avg_wait_time_critical}s
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
