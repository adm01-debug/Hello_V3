import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueueStatsData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function QueueStatus() {
  const { data: stats, isLoading } = useQueueStatsData();

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fila de Atendimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          Status da Fila
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nível de Serviço</span>
            <span className="font-semibold">{stats.serviceLevelPercent}%</span>
          </div>
          <Progress value={stats.serviceLevelPercent} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.05] bg-muted/20 p-4 transition-all duration-300 hover:bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Em espera</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.waiting}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.05] bg-muted/20 p-4 transition-all duration-300 hover:bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Tempo médio</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.avgWaitTime}s</p>
          </div>

          <div className="rounded-2xl border border-white/[0.05] bg-muted/20 p-4 transition-all duration-300 hover:bg-muted/30">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Maior espera</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{formatDuration(stats.longestWait)}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.05] bg-muted/20 p-4 transition-all duration-300 hover:bg-muted/30">
            <div className="flex items-center gap-2 text-destructive">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Abandonadas</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.abandoned}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
