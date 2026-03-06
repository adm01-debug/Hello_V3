import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertSoundConfig } from '@/hooks/useCriticalAlertNotifications';
import { Settings2 } from 'lucide-react';

interface SoundProfile {
  name: string;
  config: Partial<AlertSoundConfig>;
}

const PROFILES: SoundProfile[] = [
  { name: 'Silencioso', config: { warningVolume: 0, criticalVolume: 0 } },
  { name: 'Normal', config: { warningVolume: 0.2, criticalVolume: 0.3 } },
  { name: 'Alto', config: { warningVolume: 0.5, criticalVolume: 0.7 } },
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
