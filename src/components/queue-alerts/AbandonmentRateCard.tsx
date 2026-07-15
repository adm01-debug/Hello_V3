import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingDown } from 'lucide-react';
import type { QueueMetricsSettings, UpdateSetting } from './types';

interface Props {
  settings: QueueMetricsSettings;
  updateSetting: UpdateSetting;
}

export const AbandonmentRateCard = ({ settings, updateSetting }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-destructive" />
        Taxa de Abandono
      </CardTitle>
      <CardDescription>
        Configure os limites para alertas de taxa de abandono (em percentual)
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
            <Slider
              value={[settings.abandonment_rate_warning]}
              onValueChange={([value]) => updateSetting('abandonment_rate_warning', value)}
              min={0}
              max={50}
              step={1}
              className="flex-1"
            />
            <Badge variant="outline" className="w-16 justify-center">
              {settings.abandonment_rate_warning}%
            </Badge>
          </div>
        </div>
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Badge variant="destructive">Critical</Badge>
            Threshold Crítico
          </Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[settings.abandonment_rate_critical]}
              onValueChange={([value]) => updateSetting('abandonment_rate_critical', value)}
              min={0}
              max={50}
              step={1}
              className="flex-1"
            />
            <Badge variant="outline" className="w-16 justify-center">
              {settings.abandonment_rate_critical}%
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
