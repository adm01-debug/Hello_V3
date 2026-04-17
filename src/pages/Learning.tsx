import { useLearning } from '@/hooks/useLearning';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Learning() {
  usePageTitle('Biblioteca de Aprendizagem');
  const { modules, completions, isLoading, markComplete } = useLearning();
  const { user } = useAuthContext();
  const agentName = user?.user_metadata?.full_name || user?.email || '';

  const completedIds = new Set(completions.filter(c => c.agent_name === agentName).map(c => c.module_id));

  const grouped: Record<string, typeof modules> = {};
  modules.forEach(m => {
    grouped[m.category] = grouped[m.category] || [];
    grouped[m.category].push(m);
  });

  return (
    <NeonPageLayout>
      <NeonPageHeader title="Biblioteca de Aprendizagem" subtitle="Microlearning para evolução contínua" icon={GraduationCap} />

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando...</CardContent></Card>
      ) : modules.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum módulo disponível</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-lg font-semibold capitalize mb-3 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(m => {
                  const done = completedIds.has(m.id);
                  return (
                    <Card key={m.id} className={done ? 'border-success/40' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm">{m.title}</CardTitle>
                          {done && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-3">{m.description}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{m.duration_minutes}min</Badge>
                          <Badge variant="secondary">{m.difficulty}</Badge>
                          <Badge variant="outline">{m.content_type}</Badge>
                        </div>
                        <Button
                          size="sm" variant={done ? 'outline' : 'default'} className="w-full"
                          disabled={done}
                          onClick={() => markComplete({ agent_name: agentName, module_id: m.id })}
                        >
                          {done ? 'Concluído' : 'Marcar como concluído'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </NeonPageLayout>
  );
}
