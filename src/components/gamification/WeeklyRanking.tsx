import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface RankedAgent {
  agent_id: string;
  agent_name: string;
  total_calls: number;
  points_earned: number;
  badges_earned: number;
  avg_performance: number | null;
}

export function WeeklyRanking() {
  const [ranking, setRanking] = useState<RankedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const { data: stats } = await supabase
          .from("agent_weekly_stats")
          .select("*, agents(name)")
          .gte("week_start", weekStart.toISOString().split("T")[0])
          .order("points_earned", { ascending: false });

        if (stats) {
          setRanking(
            stats.map((s: Record<string, unknown>) => ({
              agent_id: s.agent_id,
              agent_name: s.agents?.name || "Agente",
              total_calls: s.total_calls,
              points_earned: s.points_earned,
              badges_earned: s.badges_earned,
              avg_performance: s.avg_performance,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-warning" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">{index + 1}º</span>;
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Carregando ranking...</p>;
  }

  if (ranking.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Nenhum dado disponível para esta semana.</p>;
  }

  return (
    <div className="space-y-3">
      {ranking.map((agent, index) => (
        <div
          key={agent.agent_id}
          className={`flex items-center gap-4 p-3 rounded-lg border ${
            index === 0 ? "bg-warning/5 dark:bg-warning/10 border-warning/20 dark:border-warning/30" : "bg-card"
          }`}
        >
          <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">{agent.agent_name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{agent.agent_name}</p>
            <p className="text-xs text-muted-foreground">{agent.total_calls} chamadas</p>
          </div>
          <Badge variant="secondary">{agent.points_earned} pts</Badge>
        </div>
      ))}
    </div>
  );
}
