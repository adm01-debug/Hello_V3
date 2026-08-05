import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgesShowcase } from "./BadgesShowcase";
import { WeeklyRanking } from "./WeeklyRanking";
import { AgentGoalsProgress } from "./AgentGoalsProgress";
import { Trophy, Target, Medal } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";

export function GamificationDashboard() {
  const { badges, agentBadges } = useGamification();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Gamificação</h2>
      </div>

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            Ranking Semanal
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Semanal de Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyRanking />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <BadgesShowcase badges={badges} agentBadges={agentBadges} />
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Progresso de Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentGoalsProgress />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
