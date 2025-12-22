import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAgents, formatDuration, getInitials } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusConfig = {
  available: { label: 'Disponível', color: 'bg-success' },
  busy: { label: 'Em chamada', color: 'bg-warning' },
  away: { label: 'Ausente', color: 'bg-muted-foreground' },
  offline: { label: 'Offline', color: 'bg-destructive' },
};

export function AgentsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Agentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockAgents.map((agent) => {
            const status = statusConfig[agent.status];
            
            return (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(agent.name)}
                    </div>
                    <div className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                      status.color
                    )} />
                  </div>
                  
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.currentCall ? (
                        <span className="text-warning">→ {agent.currentCall}</span>
                      ) : (
                        status.label
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">{agent.callsToday} chamadas</p>
                  <p className="text-xs text-muted-foreground">
                    Média: {formatDuration(agent.avgCallDuration)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
