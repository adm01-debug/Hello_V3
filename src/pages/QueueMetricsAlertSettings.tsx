import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Timer, 
  TrendingDown, 
  Activity, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QueueMetricsSettings {
  id: string;
  enabled: boolean;
  avg_wait_time_warning: number;
  avg_wait_time_critical: number;
  abandonment_rate_warning: number;
  abandonment_rate_critical: number;
  service_level_warning: number;
  service_level_critical: number;
  check_interval_minutes: number;
}

const QueueMetricsAlertSettings = () => {
  const [settings, setSettings] = useState<QueueMetricsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('queue_metrics_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
    } else if (data) {
      setSettings(data as QueueMetricsSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    const { error } = await supabase
      .from('queue_metrics_settings')
      .update({
        enabled: settings.enabled,
        avg_wait_time_warning: settings.avg_wait_time_warning,
        avg_wait_time_critical: settings.avg_wait_time_critical,
        abandonment_rate_warning: settings.abandonment_rate_warning,
        abandonment_rate_critical: settings.abandonment_rate_critical,
        service_level_warning: settings.service_level_warning,
        service_level_critical: settings.service_level_critical,
        check_interval_minutes: settings.check_interval_minutes,
      })
      .eq('id', settings.id);

    if (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas com sucesso');
    }
    setSaving(false);
  };

  const updateSetting = <K extends keyof QueueMetricsSettings>(
    key: K,
    value: QueueMetricsSettings[K]
  ) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

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
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Enable/Disable Toggle */}
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

      {/* Check Interval */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Intervalo de Verificação
          </CardTitle>
          <CardDescription>
            Com que frequência as métricas são verificadas
          </CardDescription>
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

      {/* Wait Time Thresholds */}
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
                  onChange={(e) => updateSetting('avg_wait_time_warning', parseInt(e.target.value) || 0)}
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
                  onChange={(e) => updateSetting('avg_wait_time_critical', parseInt(e.target.value) || 0)}
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

      {/* Abandonment Rate Thresholds */}
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

      {/* Service Level Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
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

      {/* Summary Card */}
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
                Warning: &gt;{settings.avg_wait_time_warning}s | Critical: &gt;{settings.avg_wait_time_critical}s
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Taxa de Abandono
              </p>
              <p className="text-muted-foreground">
                Warning: &gt;{settings.abandonment_rate_warning}% | Critical: &gt;{settings.abandonment_rate_critical}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" /> Nível de Serviço
              </p>
              <p className="text-muted-foreground">
                Warning: &lt;{settings.service_level_warning}% | Critical: &lt;{settings.service_level_critical}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueMetricsAlertSettings;
