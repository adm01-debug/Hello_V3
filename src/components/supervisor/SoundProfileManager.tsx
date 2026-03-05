import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertSoundConfig } from '@/hooks/useCriticalAlertNotifications';
import { Settings2 } from 'lucide-react';

interface SoundProfile {
  name: string;
  config: Partial<AlertSoundConfig>;
}

const PROFILES: SoundProfile[] = [
  { name: 'Silencioso', config: { enabled: false, volume: 0 } },
  { name: 'Normal', config: { enabled: true, volume: 0.5 } },
  { name: 'Alto', config: { enabled: true, volume: 1.0 } },
];

interface SoundProfileManagerProps {
  currentConfig: AlertSoundConfig;
  onApplyProfile: (config: AlertSoundConfig) => void;
}

export function SoundProfileManager({ currentConfig, onApplyProfile }: SoundProfileManagerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Perfil de Som</p>
          {PROFILES.map((profile) => (
            <Button
              key={profile.name}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => onApplyProfile({ ...currentConfig, ...profile.config })}
            >
              {profile.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
