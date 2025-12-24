import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Volume2, Play } from 'lucide-react';

export interface AlertSoundConfig {
  warningFrequency: number;
  warningPattern: 'single' | 'double' | 'triple';
  warningVolume: number;
  criticalFrequency: number;
  criticalPattern: 'single' | 'double' | 'triple' | 'urgent';
  criticalVolume: number;
}

interface AlertSoundSettingsProps {
  config: AlertSoundConfig;
  onConfigChange: (config: AlertSoundConfig) => void;
  onTestSound: (severity: 'warning' | 'critical') => void;
}

const FREQUENCY_PRESETS = [
  { value: 440, label: 'Baixo (440 Hz)' },
  { value: 520, label: 'Médio-Baixo (520 Hz)' },
  { value: 660, label: 'Médio (660 Hz)' },
  { value: 880, label: 'Alto (880 Hz)' },
  { value: 1000, label: 'Muito Alto (1000 Hz)' },
];

const PATTERN_OPTIONS = {
  single: 'Único',
  double: 'Duplo',
  triple: 'Triplo',
  urgent: 'Urgente (alternado)',
};

export const AlertSoundSettings = ({ config, onConfigChange, onTestSound }: AlertSoundSettingsProps) => {
  const [open, setOpen] = useState(false);

  const updateConfig = (updates: Partial<AlertSoundConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Configurar Sons de Alerta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Sound Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2 text-warning">
              ⚠️ Alerta de Aviso (Warning)
            </h4>
            
            <div className="space-y-2">
              <Label className="text-xs">Frequência</Label>
              <Select
                value={config.warningFrequency.toString()}
                onValueChange={(value) => updateConfig({ warningFrequency: parseInt(value) })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Padrão</Label>
              <Select
                value={config.warningPattern}
                onValueChange={(value: 'single' | 'double' | 'triple') => updateConfig({ warningPattern: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PATTERN_OPTIONS).filter(([key]) => key !== 'urgent').map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Volume: {Math.round(config.warningVolume * 100)}%</Label>
              <Slider
                value={[config.warningVolume]}
                onValueChange={([value]) => updateConfig({ warningVolume: value })}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onTestSound('warning')}
              className="w-full"
            >
              <Play className="h-3 w-3 mr-2" />
              Testar Som de Aviso
            </Button>
          </div>

          {/* Critical Sound Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm flex items-center gap-2 text-destructive">
              🚨 Alerta Crítico
            </h4>
            
            <div className="space-y-2">
              <Label className="text-xs">Frequência</Label>
              <Select
                value={config.criticalFrequency.toString()}
                onValueChange={(value) => updateConfig({ criticalFrequency: parseInt(value) })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Padrão</Label>
              <Select
                value={config.criticalPattern}
                onValueChange={(value: 'single' | 'double' | 'triple' | 'urgent') => updateConfig({ criticalPattern: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PATTERN_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Volume: {Math.round(config.criticalVolume * 100)}%</Label>
              <Slider
                value={[config.criticalVolume]}
                onValueChange={([value]) => updateConfig({ criticalVolume: value })}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onTestSound('critical')}
              className="w-full"
            >
              <Play className="h-3 w-3 mr-2" />
              Testar Som Crítico
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
