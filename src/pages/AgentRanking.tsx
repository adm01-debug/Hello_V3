 import { useState, useEffect, ReactNode } from 'react';
 import { Gamepad2, FlaskConical, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BadgesShowcase } from '@/components/gamification/BadgesShowcase';
import { useGamification } from '@/hooks/useGamification';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useAgentRanking } from '@/hooks/useAgentRanking';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AgentSummaryStats } from '@/components/ranking/AgentSummaryStats';
import { PerformanceEvolutionChart } from '@/components/ranking/PerformanceEvolutionChart';
import { AgentPodium } from '@/components/ranking/AgentPodium';
import { AgentGoalsGrid } from '@/components/ranking/AgentGoalsGrid';
 import { AgentRankingTable } from '@/components/ranking/AgentRankingTable';
 import { GoalsConfigDialog } from '@/components/ranking/GoalsConfigDialog';
 import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
 import { NeonPageHeader } from '@/components/layout/NeonPageHeader';

export default function AgentRanking() {
  usePageTitle('Ranking de Agentes');

  const {
    agents, performanceData, isLoading, sortBy, setSortBy, period, setPeriod,
    editingGoals, setEditingGoals, goalsDialogOpen, setGoalsDialogOpen,
    getGoalsForAgent, saveGoals, createTestData,
  } = useAgentRanking();

  const { currentAgent } = useAgentStatus();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const { badges, agentBadges } = useGamification(selectedAgentId);

  useEffect(() => {
    if (currentAgent?.id && !selectedAgentId) {
      setSelectedAgentId(currentAgent.id);
    }
  }, [currentAgent]);

   return (
     <NeonPageLayout>
       <NeonPageHeader
         title="Gamificação & Ranking"
         description="Conquistas, badges e comparativo de desempenho"
         icon={<Gamepad2 />}
         actions={
           <>
             <Button variant="outline" onClick={createTestData} size="sm" className="h-9">
               <FlaskConical className="h-4 w-4 mr-2" />Criar Dados
             </Button>
             <Select value={period} onValueChange={setPeriod}>
               <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Período" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todo Período</SelectItem>
                 <SelectItem value="today">Hoje</SelectItem>
                 <SelectItem value="week">Semana</SelectItem>
                 <SelectItem value="month">Mês</SelectItem>
               </SelectContent>
             </Select>
             <Select value={sortBy} onValueChange={setSortBy}>
               <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Ordenar" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="score">Pontuação</SelectItem>
                 <SelectItem value="calls">Chamadas</SelectItem>
                 <SelectItem value="satisfaction">Satisfação</SelectItem>
                 <SelectItem value="performance">Performance</SelectItem>
               </SelectContent>
             </Select>
           </>
         }
       />
 
       <AgentSummaryStats agents={agents} />
      <PerformanceEvolutionChart performanceData={performanceData} agents={agents} />
      <AgentPodium agents={agents} />
      <AgentGoalsGrid agents={agents} getGoalsForAgent={getGoalsForAgent}
        onEditGoals={(goals) => { setEditingGoals(goals); setGoalsDialogOpen(true); }} />
      <AgentRankingTable agents={agents} isLoading={isLoading} />
      <BadgesShowcase badges={badges} agentBadges={agentBadges} />
       <GoalsConfigDialog open={goalsDialogOpen} onOpenChange={setGoalsDialogOpen}
         editingGoals={editingGoals} setEditingGoals={setEditingGoals} onSave={saveGoals} />
     </NeonPageLayout>
   );
}
