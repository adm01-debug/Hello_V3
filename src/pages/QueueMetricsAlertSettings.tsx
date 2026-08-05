import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Save, Settings } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useQueueMetricsSettings } from '@/components/queue-alerts/useQueueMetricsSettings';
import { StatusToggleCard } from '@/components/queue-alerts/StatusToggleCard';
import { CheckIntervalCard } from '@/components/queue-alerts/CheckIntervalCard';
import { WaitTimeThresholdCard } from '@/components/queue-alerts/WaitTimeThresholdCard';
import { AbandonmentRateCard } from '@/components/queue-alerts/AbandonmentRateCard';
import { ServiceLevelCard } from '@/components/queue-alerts/ServiceLevelCard';
import { SummaryCard } from '@/components/queue-alerts/SummaryCard';

const QueueMetricsAlertSettings = () => {
  usePageTitle('Config. Alertas de Fila');
  const { settings, loading, saving, fetchSettings, save, updateSetting } =
    useQueueMetricsSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p>Configurações não encontradas</p>
        <Button onClick={fetchSettings} variant="outline" className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações de Alertas de Fila
          </h1>
          <p className="text-muted-foreground">
            Configure os thresholds para alertas automáticos de métricas de fila
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <StatusToggleCard settings={settings} updateSetting={updateSetting} />
      <CheckIntervalCard settings={settings} updateSetting={updateSetting} />
      <WaitTimeThresholdCard settings={settings} updateSetting={updateSetting} />
      <AbandonmentRateCard settings={settings} updateSetting={updateSetting} />
      <ServiceLevelCard settings={settings} updateSetting={updateSetting} />
      <SummaryCard settings={settings} />
    </div>
  );
};

export default QueueMetricsAlertSettings;
