import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, BellOff, PhoneCall, Radio } from 'lucide-react';
import { AlertSoundSettings } from '../AlertSoundSettings';
import { SoundProfileManager } from '../SoundProfileManager';
import type { SupervisorPanelState } from './types';

export function PanelHeader({ s }: { s: SupervisorPanelState }) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Painel do Supervisor
          {s.activeBargeIn && (
            <Badge variant="destructive" className="ml-2 animate-pulse">
              <PhoneCall className="h-3 w-3 mr-1" />Em Conferência
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          <SoundProfileManager currentConfig={s.soundConfig} onApplyProfile={s.handleSoundConfigChange} />
          <AlertSoundSettings config={s.soundConfig} onConfigChange={s.handleSoundConfigChange} onTestSound={s.playAlertSound} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={s.soundEnabled ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={s.soundEnabled ? () => s.handleSoundEnabledChange(false) : s.handleEnableSound}
                >
                  {s.soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{s.soundEnabled ? 'Desativar notificações sonoras' : 'Ativar notificações sonoras'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </CardHeader>
  );
}
