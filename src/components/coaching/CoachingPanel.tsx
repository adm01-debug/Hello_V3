import { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Target, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoaching, CoachingRecommendation } from '@/hooks/useCoaching';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useAuditLog } from '@/hooks/useAuditLog';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  communication: { label: 'Comunicação', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-blue-500' },
  efficiency: { label: 'Eficiência', icon: <Clock className="h-4 w-4" />, color: 'bg-green-500' },
  satisfaction: { label: 'Satisfação', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-purple-500' },
  skills: { label: 'Habilidades', icon: <Brain className="h-4 w-4" />, color: 'bg-orange-500' },
  goals: { label: 'Metas', icon: <Target className="h-4 w-4" />, color: 'bg-pink-500' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'Alta', color: 'bg-red-500 text-white' },
  medium: { label: 'Média', color: 'bg-yellow-500 text-black' },
  low: { label: 'Baixa', color: 'bg-green-500 text-white' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'Em Progresso', color: 'bg-blue-500 text-white' },
  completed: { label: 'Concluído', color: 'bg-green-500 text-white' },
  dismissed: { label: 'Dispensado', color: 'bg-gray-500 text-white' },
};

export function CoachingPanel() {
  const { agents, currentAgent, setAgent } = useAgentStatus();
  const { logCoachingAccess, logAgentProfileAccess } = useAuditLog();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(currentAgent?.id);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { 
    recommendations, 
    isLoading, 
    isGenerating, 
    generateRecommendations, 
    updateStatus,
    deleteRecommendation 
  } = useCoaching(selectedAgentId);

  useEffect(() => {
    if (currentAgent?.id && !selectedAgentId) {
      setSelectedAgentId(currentAgent.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAgent]);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setAgent(agentId);
      // Log audit event for agent profile access
      logAgentProfileAccess(agentId, agent.name);
    }
  };

  // Log coaching access when recommendations are viewed
  useEffect(() => {
    if (recommendations.length > 0 && selectedAgentId) {
      recommendations.forEach(rec => {
        logCoachingAccess(rec.id, agents.find(a => a.id === selectedAgentId)?.name);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendations.length, selectedAgentId]);

  const filteredRecommendations = recommendations.filter(rec => 
    filterStatus === 'all' || rec.status === filterStatus
  );

  const pendingCount = recommendations.filter(r => r.status === 'pending').length;
  const inProgressCount = recommendations.filter(r => r.status === 'in_progress').length;
  const completedCount = recommendations.filter(r => r.status === 'completed').length;
  const completionRate = recommendations.length > 0 
    ? (completedCount / recommendations.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Coaching IA</h2>
            <p className="text-muted-foreground">Recomendações personalizadas de melhoria</p>
          </div>
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
          
          <Button 
            onClick={generateRecommendations} 
            disabled={isGenerating || !selectedAgentId}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Recomendações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="p-2 rounded-full bg-warning/20">
                <Lightbulb className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
              <div className="p-2 rounded-full bg-info/20">
                <PlayCircle className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <div className="p-2 rounded-full bg-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-sm font-medium">{completionRate.toFixed(0)}%</p>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="dismissed">Dispensadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations */}
      {filteredRecommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma recomendação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {selectedAgentId 
                ? 'Clique em "Gerar Recomendações" para criar novas sugestões de coaching.'
                : 'Selecione um agente para ver ou gerar recomendações.'}
            </p>
            {selectedAgentId && (
              <Button onClick={generateRecommendations} disabled={isGenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Recomendações
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {filteredRecommendations.map((rec) => {
            const category = categoryConfig[rec.category] || categoryConfig.skills;
            const priority = priorityConfig[rec.priority] || priorityConfig.medium;
            const status = statusConfig[rec.status] || statusConfig.pending;

            return (
              <AccordionItem 
                key={rec.id} 
                value={rec.id}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className={cn('p-2 rounded-lg text-white', category.color)}>
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium truncate">{rec.title}</h4>
                        <Badge className={priority.color} variant="secondary">
                          {priority.label}
                        </Badge>
                        <Badge className={status.color} variant="secondary">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {category.label} • {new Date(rec.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-sm">{rec.description}</p>
                    
                    {rec.action_items?.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Ações Recomendadas:</h5>
                        <ul className="space-y-1">
                          {rec.action_items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.metrics_snapshot && Object.keys(rec.metrics_snapshot).length > 0 && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h5 className="text-sm font-medium mb-2">Métricas na Geração:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Chamadas:</span>{' '}
                            <span className="font-medium">{rec.metrics_snapshot.totalCalls}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Satisfação:</span>{' '}
                            <span className="font-medium">{rec.metrics_snapshot.avgSatisfaction}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Performance:</span>{' '}
                            <span className="font-medium">{rec.metrics_snapshot.avgPerformance}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duração Média:</span>{' '}
                            <span className="font-medium">{rec.metrics_snapshot.avgDuration}s</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {rec.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateStatus(rec.id, 'in_progress')}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateStatus(rec.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dispensar
                          </Button>
                        </>
                      )}
                      {rec.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateStatus(rec.id, 'completed')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteRecommendation(rec.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
