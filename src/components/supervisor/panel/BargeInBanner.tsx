import { Button } from '@/components/ui/button';
import { PhoneOff, Users } from 'lucide-react';
import type { SupervisorPanelState } from './types';

export function BargeInBanner({ s }: { s: SupervisorPanelState }) {
  if (!s.activeBargeIn) return null;
  return (
    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-sm">Conferência Ativa</p>
            <p className="text-xs text-muted-foreground">
              Com {s.activeBargeIn.agent_name} • {s.getCallDuration(s.activeBargeIn.started_at)}
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={s.endBargeIn}>
          <PhoneOff className="h-4 w-4 mr-1" />Sair
        </Button>
      </div>
    </div>
  );
}
