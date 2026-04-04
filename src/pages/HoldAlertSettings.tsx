import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Clock, AlertTriangle, Bell, Save, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface HoldAlertSettings {
  id: string;
  warning_threshold_seconds: number;
  critical_threshold_seconds: number;
  enabled: boolean;
  notify_on_warning: boolean;
  notify_on_critical: boolean;
}

export default function HoldAlertSettings() {
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HoldAlertSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hold_alert_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      logger.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações', { description: 'Não foi possível carregar as configurações de alertas.' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('hold_alert_settings')
        .update({
          warning_threshold_seconds: settings.warning_threshold_seconds,
          critical_threshold_seconds: settings.critical_threshold_seconds,
          enabled: settings.enabled,
          notify_on_warning: settings.notify_on_warning,
          notify_on_critical: settings.notify_on_critical,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Configurações salvas', { description: 'Os limites de alerta foram atualizados com sucesso.' });
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Erro ao salvar', { description: 'Não foi possível salvar as configurações.' });
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs}s`;
    if (secs === 0) return `${minutes}min`;
    return `${minutes}min ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Configurações não encontradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configurações de Alertas de Espera
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure os limites de tempo para geração automática de alertas
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enable/Disable Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Ativar ou desativar a geração automática de alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas Automáticos</Label>
                <p className="text-sm text-muted-foreground">
                  Gerar alertas quando o tempo de espera exceder os limites
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificar em Warning</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificação para alertas de aviso
                </p>
              </div>
              <Switch
                checked={settings.notify_on_warning}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notify_on_warning: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificar em Critical</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificação para alertas críticos
                </p>
              </div>
              <Switch
                checked={settings.notify_on_critical}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notify_on_critical: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Thresholds Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Limites de Tempo
            </CardTitle>
            <CardDescription>
              Configure os tempos limite para cada nível de alerta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Warning Threshold */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  Limite Warning
                </Label>
                <span className="text-lg font-semibold text-warning">
                  {formatDuration(settings.warning_threshold_seconds)}
                </span>
              </div>
              <Slider
                value={[settings.warning_threshold_seconds]}
                onValueChange={([value]) =>
                  setSettings({
                    ...settings,
                    warning_threshold_seconds: value,
                    // Ensure critical is always >= warning
                    critical_threshold_seconds: Math.max(
                      settings.critical_threshold_seconds,
                      value + 30
                    ),
                  })
                }
                min={15}
                max={300}
                step={15}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>15s</span>
                <span>5min</span>
              </div>
            </div>

            {/* Critical Threshold */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  Limite Critical
                </Label>
                <span className="text-lg font-semibold text-destructive">
                  {formatDuration(settings.critical_threshold_seconds)}
                </span>
              </div>
              <Slider
                value={[settings.critical_threshold_seconds]}
                onValueChange={([value]) =>
                  setSettings({
                    ...settings,
                    critical_threshold_seconds: Math.max(
                      value,
                      settings.warning_threshold_seconds + 30
                    ),
                  })
                }
                min={30}
                max={600}
                step={30}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30s</span>
                <span>10min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Visualização dos Alertas
          </CardTitle>
          <CardDescription>
            Exemplo de como os alertas serão exibidos com as configurações atuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                <span className="font-semibold text-warning">⚠️ Tempo de Espera Elevado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cliente está em espera há {formatDuration(settings.warning_threshold_seconds)} (limite: {formatDuration(settings.warning_threshold_seconds)}). 
                Considere retomar a chamada.
              </p>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <span className="font-semibold text-destructive">🚨 Tempo de Espera Crítico</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cliente está em espera há {formatDuration(settings.critical_threshold_seconds)} (limite crítico: {formatDuration(settings.critical_threshold_seconds)}). 
                Ação imediata necessária!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/20 p-3">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Como funciona?</h3>
              <p className="text-sm text-muted-foreground">
                O sistema verifica automaticamente a cada minuto todas as chamadas em espera. 
                Quando o tempo de espera excede o limite de <strong>Warning</strong>, um alerta amarelo é gerado. 
                Se continuar e exceder o limite <strong>Critical</strong>, um alerta vermelho é criado com notificação prioritária.
                Os alertas são exibidos no painel de notificações e na página de Alertas de Espera.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
