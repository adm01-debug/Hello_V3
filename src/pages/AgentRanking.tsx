import { useState, useEffect } from 'react';
import { Gamepad2, FlaskConical } from 'lucide-react';
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gamificação & Ranking</h1>
            <p className="text-muted-foreground">Conquistas, badges e comparativo de desempenho</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={createTestData}>
            <FlaskConical className="h-4 w-4 mr-2" />Criar Dados de Teste
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Pontuação</SelectItem>
              <SelectItem value="calls">Total de Chamadas</SelectItem>
              <SelectItem value="satisfaction">Satisfação</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AgentSummaryStats agents={agents} />
      <PerformanceEvolutionChart performanceData={performanceData} agents={agents} />
      <AgentPodium agents={agents} />
      <AgentGoalsGrid agents={agents} getGoalsForAgent={getGoalsForAgent}
        onEditGoals={(goals) => { setEditingGoals(goals); setGoalsDialogOpen(true); }} />
      <AgentRankingTable agents={agents} isLoading={isLoading} />
      <BadgesShowcase badges={badges} agentBadges={agentBadges} />
      <GoalsConfigDialog open={goalsDialogOpen} onOpenChange={setGoalsDialogOpen}
        editingGoals={editingGoals} setEditingGoals={setEditingGoals} onSave={saveGoals} />
    </div>
  );
}
