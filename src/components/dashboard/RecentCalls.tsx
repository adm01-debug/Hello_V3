import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Play,
  MoreHorizontal 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCallHistory, formatDuration } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecentCalls() {
  const recentCalls = mockCallHistory.slice(0, 5);

  const getCallIcon = (type: string, status: string) => {
    if (status === 'missed') return PhoneMissed;
    return type === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  };

  const getCallColor = (status: string) => {
    switch (status) {
      case 'missed':
        return 'text-destructive bg-destructive/10';
      case 'completed':
        return 'text-success bg-success/10';
      case 'voicemail':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Chamadas Recentes</CardTitle>
        <Button variant="ghost" size="sm">
          Ver todas
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCalls.map((call) => {
            const Icon = getCallIcon(call.type, call.status);
            
            return (
              <div
                key={call.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    getCallColor(call.status)
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div>
                    <p className="font-medium">{call.contactName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{call.contactPhone}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(call.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {call.duration > 0 && (
                    <span className="font-mono text-sm text-muted-foreground">
                      {formatDuration(call.duration)}
                    </span>
                  )}
                  
                  {call.recording && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
