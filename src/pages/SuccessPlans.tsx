import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Target } from 'lucide-react';
import { useSuccessPlans } from '@/hooks/useSuccessPlans';
import { usePageTitle } from '@/hooks/usePageTitle';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';

export default function SuccessPlans() {
  usePageTitle('Planos de Sucesso');
  const { plans, milestones, loading, toggleMilestone } = useSuccessPlans();

  return (
    <NeonPageLayout>
      <div>
        <h1 className="text-3xl font-bold">Planos de Sucesso</h1>
        <p className="text-muted-foreground">Marcos e objetivos por conta</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : plans.length === 0 ? (
        <Card><CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">Nenhum plano de sucesso ainda</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((p) => {
            const ms = milestones[p.id] ?? [];
            const done = ms.filter((m) => m.status === 'completed').length;
            const progress = ms.length ? Math.round((done / ms.length) * 100) : p.progress_percent;
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4" /> {p.title}
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="ml-auto">{p.status}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{p.objective}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground">{done} de {ms.length} marcos · alvo {p.target_date}</p>
                  <div className="space-y-2">
                    {ms.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <Button variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => toggleMilestone(m.id, m.status === 'completed' ? 'pending' : 'completed')}>
                          {m.status === 'completed'
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            : <Circle className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <span className={m.status === 'completed' ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                        {m.due_date && <span className="ml-auto text-xs text-muted-foreground">{m.due_date}</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </NeonPageLayout>
  );
}
