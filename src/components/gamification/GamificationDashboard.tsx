import { useState, useEffect } from 'react';
import { Gamepad2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGamification } from '@/hooks/useGamification';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { WeeklyRanking } from './WeeklyRanking';
import { AgentGoalsProgress } from './AgentGoalsProgress';
import { BadgesShowcase } from './BadgesShowcase';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export function GamificationDashboard() {
  const { agents, currentAgent, setAgent } = useAgentStatus();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(currentAgent?.id);
  const [goals, setGoals] = useState({ calls_target: 50, performance_target: 8, satisfaction_target: 8 });

  const { 
    badges, 
    agentBadges, 
    weeklyStats, 
    rankings, 
    isLoading,
    refetch 
  } = useGamification(selectedAgentId);

  useEffect(() => {
    if (currentAgent?.id && !selectedAgentId) {
      setSelectedAgentId(currentAgent.id);
    }
  }, [currentAgent]);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!selectedAgentId) return;
      
      const agent = agents.find(a => a.id === selectedAgentId);
      if (!agent) return;

      const { data } = await supabase
        .from('agent_goals')
        .select('*')
        .eq('agent_name', agent.name)
        .single();

      if (data) {
        setGoals({
          calls_target: data.calls_target,
          performance_target: Number(data.performance_target),
          satisfaction_target: Number(data.satisfaction_target),
        });
      }
    };

    fetchGoals();
  }, [selectedAgentId, agents]);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setAgent(agentId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Gamificação</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedAgentId} onValueChange={handleAgentChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um agente" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <AgentGoalsProgress
            goals={goals}
            current={{
              total_calls: weeklyStats?.total_calls || 0,
              avg_performance: weeklyStats?.avg_performance || 0,
              avg_satisfaction: weeklyStats?.avg_satisfaction || 0,
            }}
          />
        </div>
        
        <div className="lg:col-span-2">
          <WeeklyRanking rankings={rankings} currentAgentId={selectedAgentId} />
        </div>
      </div>

      <BadgesShowcase badges={badges} agentBadges={agentBadges} />
    </div>
  );
}
