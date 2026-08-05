import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import type { QueueMetricsSettings, UpdateSetting } from './types';

interface Props {
  settings: QueueMetricsSettings;
  updateSetting: UpdateSetting;
}

export const ServiceLevelCard = ({ settings, updateSetting }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Activity className="h-5 w-5 text-success" />
        Nível de Serviço
      </CardTitle>
      <CardDescription>
        Configure os limites para alertas de nível de serviço (alerta quando abaixo do valor)
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
              value={[settings.service_level_warning]}
              onValueChange={([value]) => updateSetting('service_level_warning', value)}
              min={50}
              max={100}
              step={1}
              className="flex-1"
            />
            <Badge variant="outline" className="w-16 justify-center">
              {settings.service_level_warning}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Alerta quando nível &lt; {settings.service_level_warning}%
          </p>
        </div>
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Badge variant="destructive">Critical</Badge>
            Threshold Crítico
          </Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[settings.service_level_critical]}
              onValueChange={([value]) => updateSetting('service_level_critical', value)}
              min={30}
              max={100}
              step={1}
              className="flex-1"
            />
            <Badge variant="outline" className="w-16 justify-center">
              {settings.service_level_critical}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Alerta crítico quando nível &lt; {settings.service_level_critical}%
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
