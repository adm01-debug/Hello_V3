import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock, Phone, User, Users } from 'lucide-react';
import type { SupervisorPanelState } from './types';

export function ActiveCallsList({ s }: { s: SupervisorPanelState }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Phone className="h-4 w-4" />Chamadas Ativas ({s.activeCalls.length})
      </h4>
      {s.loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      ) : s.activeCalls.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Nenhuma chamada ativa</div>
      ) : (
        <ScrollArea className="h-[120px]">
          <div className="space-y-2">
            {s.activeCalls.map((call) => {
              const inBargeIn = s.isCallInBargeIn(call.id);
              const selected = s.selectedCall?.id === call.id;
              return (
                <div
                  key={call.id}
                  onClick={() => s.setSelectedCall(call)}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    selected
                      ? 'border-primary bg-primary/5'
                      : inBargeIn
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border hover:border-primary/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded-full', inBargeIn ? 'bg-destructive/10' : 'bg-success/10')}>
                        {inBargeIn ? (
                          <Users className="h-3 w-3 text-destructive" />
                        ) : (
                          <Phone className="h-3 w-3 text-success" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{call.caller_name || call.caller_phone || 'Desconhecido'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />{call.agent_name || 'Sem agente'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={inBargeIn ? 'destructive' : 'secondary'} className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />{s.getCallDuration(call.started_at)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
