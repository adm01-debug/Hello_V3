import { useEffect, useState } from 'react';
import { Calendar, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isPast, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useScheduledCallbacks } from '@/hooks/useScheduledCallbacks';
import { ScheduleCallbackDialog } from './ScheduleCallbackDialog';
import { toast } from 'sonner';

export function CallbackNotificationBadge() {
  const { callbacks, completeCallback } = useScheduledCallbacks();
  const [open, setOpen] = useState(false);

  const pendingCallbacks = callbacks.filter(c => c.status === 'pending');
  const overdueCount = pendingCallbacks.filter(c => isPast(new Date(c.scheduled_at))).length;
  const upcomingSoonCount = pendingCallbacks.filter(c => {
    const minutesUntil = differenceInMinutes(new Date(c.scheduled_at), new Date());
    return minutesUntil > 0 && minutesUntil <= 30;
  }).length;

  const totalAlerts = overdueCount + upcomingSoonCount;

  const handleCall = (phone: string, name: string) => {
    toast.info(`Iniciando chamada para ${phone}...`);
    setOpen(false);
  };

  const handleComplete = async (id: string) => {
    await completeCallback(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Calendar className="h-5 w-5" />
          {totalAlerts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Callbacks</h4>
            {pendingCallbacks.length > 0 && (
              <Badge variant="secondary">{pendingCallbacks.length}</Badge>
            )}
          </div>
          <ScheduleCallbackDialog 
            trigger={
              <Button variant="ghost" size="sm">
                + Novo
              </Button>
            }
          />
        </div>

        <ScrollArea className="h-[300px]">
          {pendingCallbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum callback pendente</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingCallbacks.slice(0, 10).map((callback) => {
                const isOverdue = isPast(new Date(callback.scheduled_at));
                const minutesUntil = differenceInMinutes(new Date(callback.scheduled_at), new Date());
                const isSoon = minutesUntil > 0 && minutesUntil <= 30;

                return (
                  <div 
                    key={callback.id} 
                    className={`p-3 hover:bg-muted/50 ${
                      isOverdue ? 'bg-destructive/5' : 
                      isSoon ? 'bg-warning/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{callback.caller_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {callback.caller_phone}
                        </p>
                        <p className={`text-xs mt-1 ${isOverdue ? 'text-destructive' : isSoon ? 'text-warning' : 'text-muted-foreground'}`}>
                          {isOverdue && <Bell className="inline h-3 w-3 mr-1" />}
                          {format(new Date(callback.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 px-2 text-success hover:text-success"
                          onClick={() => handleCall(callback.caller_phone, callback.caller_name)}
                        >
                          Ligar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => handleComplete(callback.id)}
                        >
                          ✓
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {pendingCallbacks.length > 10 && (
          <div className="border-t px-4 py-2 text-center">
            <Button variant="link" size="sm" className="text-xs">
              Ver todos ({pendingCallbacks.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
