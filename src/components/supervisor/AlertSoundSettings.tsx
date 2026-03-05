import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Volume2, Play } from 'lucide-react';
import { AlertSoundConfig } from '@/hooks/useCriticalAlertNotifications';

interface AlertSoundSettingsProps {
  config: AlertSoundConfig;
  onConfigChange: (config: AlertSoundConfig) => void;
  onTestSound: (severity: 'critical' | 'warning') => void;
}

export function AlertSoundSettings({ config, onConfigChange, onTestSound }: AlertSoundSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Volume2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <p className="text-sm font-medium">Configurações de Som</p>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Volume Warning</Label>
            <Slider
              value={[config.warningVolume * 100]}
              onValueChange={([v]) => onConfigChange({ ...config, warningVolume: v / 100 })}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Volume Critical</Label>
            <Slider
              value={[config.criticalVolume * 100]}
              onValueChange={([v]) => onConfigChange({ ...config, criticalVolume: v / 100 })}
              max={100}
              step={5}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onTestSound('warning')} className="flex-1 gap-1">
              <Play className="h-3 w-3" /> Warning
            </Button>
            <Button variant="outline" size="sm" onClick={() => onTestSound('critical')} className="flex-1 gap-1">
              <Play className="h-3 w-3" /> Critical
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
