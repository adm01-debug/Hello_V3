import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueueStatsData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
 import { Progress } from '@/components/ui/progress';
 import { Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
 import { cn } from '@/lib/utils';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function QueueStatus() {
   const { data: stats, isLoading, isFetching } = useQueueStatsData();

   if ((isLoading || !stats) && !stats) {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="text-lg font-semibold">Fila de Atendimento</CardTitle>
         </CardHeader>
       <CardContent className={cn("space-y-6 transition-opacity duration-300", isFetching && "opacity-50")}>
           <div className="space-y-2">
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-2 w-full" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             {[1, 2, 3, 4].map(i => (
               <Skeleton key={i} className="h-20 rounded-lg" />
             ))}
           </div>
         </CardContent>
       </Card>
     );
   }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Fila de Atendimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nível de Serviço</span>
             <span className="font-semibold">{stats?.serviceLevelPercent ?? 0}%</span>
          </div>
           <Progress value={stats?.serviceLevelPercent ?? 0} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Em espera</span>
            </div>
             <p className="mt-1 text-2xl font-bold">{stats?.waiting ?? 0}</p>
          </div>

          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Tempo médio</span>
            </div>
             <p className="mt-1 text-2xl font-bold">{stats?.avgWaitTime ?? 0}s</p>
          </div>

          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Maior espera</span>
            </div>
             <p className="mt-1 text-2xl font-bold">{formatDuration(stats?.longestWait ?? 0)}</p>
          </div>

          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-destructive">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Abandonadas</span>
            </div>
             <p className="mt-1 text-2xl font-bold">{stats?.abandoned ?? 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
