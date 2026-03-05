import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { AlertSoundConfig } from '@/hooks/useCriticalAlertNotifications';

interface AlertSoundSettingsProps {
  config: AlertSoundConfig;
  onConfigChange: (config: AlertSoundConfig) => void;
}

export function AlertSoundSettings({ config, onConfigChange }: AlertSoundSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          {config.enabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Sons de alerta</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onConfigChange({ ...config, enabled })}
            />
          </div>
          {config.enabled && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Volume</Label>
              <Slider
                value={[config.volume * 100]}
                onValueChange={([v]) => onConfigChange({ ...config, volume: v / 100 })}
                max={100}
                step={5}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
