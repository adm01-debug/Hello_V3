import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAgentsListData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponível', color: 'bg-success' },
  busy: { label: 'Em chamada', color: 'bg-warning' },
  away: { label: 'Ausente', color: 'bg-muted-foreground' },
  offline: { label: 'Offline', color: 'bg-destructive' },
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function AgentsList() {
  const { data: agents, isLoading } = useAgentsListData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Agentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-premium border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/5 text-primary/80">
            <Users className="h-5 w-5" />
          </div>
          Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!agents || agents.length === 0 ? (
          <EmptyState 
            iconType="contacts"
            title="Nenhum agente disponível"
            description="Não há agentes cadastrados no sistema."
            size="sm"
          />
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const status = statusConfig[agent.status] || statusConfig.offline;
              
              return (
                <div
                  key={agent.id}
                  className="group/item flex items-center justify-between rounded-2xl border border-white/[0.05] bg-muted/20 p-4 transition-all duration-300 hover:bg-muted/40 hover:border-white/[0.1] hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary transition-transform duration-500 group-hover/item:rotate-3">
                        {getInitials(agent.name)}
                      </div>
                      <div 
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                          status.color
                        )} 
                        aria-label={status.label}
                      />
                    </div>
                    
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {status.label} • Ramal {agent.extension}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
