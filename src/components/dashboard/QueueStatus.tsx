import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockQueueStats, formatDuration } from '@/data/mockData';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export function QueueStatus() {
  const stats = mockQueueStats;

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
            <span className="font-semibold">{stats.serviceLevelPercent}%</span>
          </div>
          <Progress value={stats.serviceLevelPercent} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Em espera</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.waiting}</p>
          </div>

          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Tempo médio</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.avgWaitTime}s</p>
          </div>

          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Maior espera</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{formatDuration(stats.longestWait)}</p>
          </div>

          <div className="rounded-lg border border-border bg-accent/30 p-3">
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
