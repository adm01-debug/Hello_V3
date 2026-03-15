import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Target } from "lucide-react";

interface GoalProgress {
  agent_name: string;
  calls_target: number;
  satisfaction_target: number;
  performance_target: number;
  current_calls: number;
}

export function AgentGoalsProgress() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoals() {
      try {
        const { data } = await supabase.from("agent_goals").select("*");
        if (data) {
          setGoals(
            data.map((g) => ({
              agent_name: g.agent_name,
              calls_target: g.calls_target,
              satisfaction_target: Number(g.satisfaction_target),
              performance_target: Number(g.performance_target),
              current_calls: 0, // Would be populated from real-time stats
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    }
    fetchGoals();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Carregando metas...</p>;
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>Nenhuma meta configurada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {goals.map((goal) => {
        const callProgress = Math.min(100, (goal.current_calls / goal.calls_target) * 100);
        return (
          <div key={goal.agent_name} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{goal.agent_name}</h4>
              {callProgress >= 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Chamadas</span>
                  <span>{goal.current_calls}/{goal.calls_target}</span>
                </div>
                <Progress value={callProgress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Meta Satisfação:</span>{" "}
                  <span className="font-medium">{goal.satisfaction_target}/10</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Meta Performance:</span>{" "}
                  <span className="font-medium">{goal.performance_target}/10</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
