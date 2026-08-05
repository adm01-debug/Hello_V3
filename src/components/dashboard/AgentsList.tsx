 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { EmptyState } from '@/components/ui/empty-state';
 import { useAgentsListData } from '@/hooks/useDashboardData';
 import { Skeleton } from '@/components/ui/skeleton';
 import { cn, formatDuration } from '@/lib/utils';
 import { useState, useEffect } from 'react';

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

interface Agent {
  id: string;
  name: string;
  status: string;
  avatar_url: string | null;
  extension: string;
  active_call_started_at?: string;
  active_call_caller?: string;
}

 function AgentItem({ agent }: { agent: Agent }) {
   const status = statusConfig[agent.status] || statusConfig.offline;
   const [duration, setDuration] = useState<number | null>(null);
 
   useEffect(() => {
     if (!agent.active_call_started_at) {
       setDuration(null);
       return;
     }
     const start = new Date(agent.active_call_started_at).getTime();
     const update = () => {
       const now = Date.now();
       setDuration(Math.floor((now - start) / 1000));
     };
     update();
     const interval = setInterval(update, 1000);
     return () => clearInterval(interval);
   }, [agent.active_call_started_at]);
 
    return (
      <div className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-all duration-300",
        agent.status === 'busy' ? "border-warning/30 bg-warning/5 shadow-[0_0_10px_hsl(var(--warning)/0.05)]" : 
        agent.status === 'available' ? "border-success/30 bg-success/5" :
        "border-border bg-card hover:border-primary/30"
      )}>
        <div className="flex items-center gap-3">
         <div className="relative">
           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
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
             {agent.active_call_caller && ` • ${agent.active_call_caller}`}
           </p>
         </div>
       </div>
       {duration !== null && (
         <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-warning/10 text-warning text-xs font-medium animate-pulse">
           <div className="h-1.5 w-1.5 rounded-full bg-warning" />
           {formatDuration(duration)}
         </div>
       )}
     </div>
   );
 }
 
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Agentes</CardTitle>
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
             {agents.map((agent) => <AgentItem key={agent.id} agent={agent} />)}
           </div>
        )}
      </CardContent>
    </Card>
  );
}
