import { Card } from '@/components/ui/card';
import { Sparkles, ListChecks, AlertCircle, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePendingActionItems } from '@/hooks/useMeetingSummary';

export function MeetingSummaryDashboardCard() {
  const { data, isLoading } = usePendingActionItems();

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-primary/20 col-span-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Resumos IA de Reuniões</h3>
            <p className="text-xs text-muted-foreground">Notas executivas pós-chamada geradas automaticamente</p>
          </div>
        </div>
        <Button asChild size="sm" variant="ghost" className="gap-1">
          <Link to="/meeting-summaries">Ver todos <ArrowRight className="h-3 w-3" /></Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Resumos recentes</div>
            <div className="text-2xl font-bold">{data?.recent.length ?? 0}</div>
          </div>
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Follow-ups
            </div>
            <div className="text-2xl font-bold text-warning">{data?.followUps ?? 0}</div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <ListChecks className="h-3 w-3" /> Itens de ação
            </div>
            <div className="text-2xl font-bold text-primary">{data?.total ?? 0}</div>
          </div>
        </div>
      )}
    </Card>
  );
}
