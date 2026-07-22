import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface CoachingPlan {
  agent_name: string;
  plan: string;
  metrics?: { avg_performance: number; avg_csat: number; sample_size: number };
  generated_at: string;
}

export function CoachingCopilotCard({ defaultAgent = '' }: { defaultAgent?: string }) {
  const [agent, setAgent] = useState(defaultAgent);
  const [plan, setPlan] = useState<CoachingPlan | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-coaching-plan', {
        body: { agent_name: agent },
      });
      if (error) throw error;
      return data as CoachingPlan;
    },
    onSuccess: (data) => {
      setPlan(data);
      toast.success('Plano de coaching gerado');
    },
    onError: (err: Error) => {
      logger.error('Falha ao gerar plano', err);
      toast.error('Falha ao gerar plano', { description: err.message });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Coaching Copilot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome do agente"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          />
          <Button onClick={() => generate.mutate()} disabled={!agent || generate.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generate.isPending ? 'Analisando...' : 'Gerar plano'}
          </Button>
        </div>

        {generate.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        )}

        {plan && !generate.isPending && (
          <div className="space-y-3">
            {plan.metrics && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <MiniMetric label="Performance" value={`${plan.metrics.avg_performance.toFixed(1)}/5`} />
                <MiniMetric label="CSAT" value={`${plan.metrics.avg_csat.toFixed(1)}/5`} />
                <MiniMetric label="Amostras" value={String(plan.metrics.sample_size)} />
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm bg-muted/40 p-4 rounded-md">
              {plan.plan}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded p-2 text-center">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}
