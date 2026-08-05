import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { QueueMetricsSettings, UpdateSetting } from './types';

interface Props {
  settings: QueueMetricsSettings;
  updateSetting: UpdateSetting;
}

export const StatusToggleCard = ({ settings, updateSetting }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        Status dos Alertas
        <Badge variant={settings.enabled ? 'default' : 'secondary'}>
          {settings.enabled ? 'Ativo' : 'Desativado'}
        </Badge>
      </CardTitle>
      <CardDescription>
        Ative ou desative os alertas automáticos de métricas de fila
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="font-medium">
            {settings.enabled
              ? 'Alertas estão sendo monitorados automaticamente'
              : 'Alertas estão desativados'}
          </span>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => updateSetting('enabled', checked)}
        />
      </div>
    </CardContent>
  </Card>
);
