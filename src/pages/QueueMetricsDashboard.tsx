import { Activity, Users, Clock, PhoneOff, TrendingUp, TrendingDown, RefreshCw, Phone, Pause, CheckCircle, AlertTriangle, AlertCircle, Gauge, Target, Settings, Zap, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { DashboardGoalsSettings } from '@/components/dashboard/DashboardGoalsSettings';
import { GoalViolationsHistory } from '@/components/dashboard/GoalViolationsHistory';
import { useQueueMetrics } from '@/hooks/useQueueMetrics';
import { usePageTitle } from '@/hooks/usePageTitle';
import { QueueMetricsCards } from '@/components/queue/QueueMetricsCards';
import { QueueGoalsTab } from '@/components/queue/QueueGoalsTab';
import { QueueRealtimeCharts } from '@/components/queue/QueueRealtimeCharts';

const QueueMetricsDashboard = () => {
  usePageTitle('Métricas de Fila');
  const q = useQueueMetrics();

  const getStatusIcon = (status: 'ok' | 'warning' | 'critical') => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'critical': return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: 'ok' | 'warning' | 'critical') => {
    switch (status) {
      case 'ok': return 'border-success/30 bg-success/10';
      case 'warning': return 'border-warning/30 bg-warning/10';
      case 'critical': return 'border-destructive/30 bg-destructive/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Métricas</h1>
          <p className="text-muted-foreground mt-1">Monitoramento em tempo real da fila</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Última atualização: {format(q.lastUpdate, 'HH:mm:ss')}</div>
          <Button onClick={q.runGoalsCheck} disabled={q.checkingGoals} size="sm" variant="outline">
            <Zap className={`h-4 w-4 mr-2 ${q.checkingGoals ? 'animate-pulse' : ''}`} />Verificar Metas
          </Button>
          <Button onClick={q.fetchMetrics} disabled={q.loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${q.loading ? 'animate-spin' : ''}`} />Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={q.activeTab} onValueChange={q.setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2"><Activity className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />Metas
            {(q.criticalGoals.length > 0 || q.warningGoals.length > 0) && (
              <Badge variant={q.criticalGoals.length > 0 ? 'destructive' : 'outline'} className="ml-1">
                {q.criticalGoals.length + q.warningGoals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2"><History className="h-4 w-4" />Histórico</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2"><Settings className="h-4 w-4" />Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {q.goalStatuses.length > 0 && (q.criticalGoals.length > 0 || q.warningGoals.length > 0) && (
            <Card className="border-warning bg-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg"><Target className="h-5 w-5" />Status das Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {q.goalStatuses.map(({ goal, currentValue, status }) => (
                    <div key={goal.id} className={`p-3 rounded-lg border ${getStatusColor(status)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{goal.name}</span>
                        {getStatusIcon(status)}
                      </div>
                      <div className="text-2xl font-bold">{q.formatGoalValue(currentValue, goal.metric_type)}</div>
                      <div className="text-xs text-muted-foreground">Meta: {q.formatGoalValue(goal.target_value, goal.metric_type)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <QueueMetricsCards metrics={q.metrics} formatTime={q.formatTime} />
          <QueueRealtimeCharts realtimeData={q.realtimeData} metrics={q.metrics} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <QueueGoalsTab goalStatuses={q.goalStatuses} formatGoalValue={q.formatGoalValue} setActiveTab={q.setActiveTab} getStatusColor={getStatusColor} getStatusIcon={getStatusIcon} />
        </TabsContent>

        <TabsContent value="history"><GoalViolationsHistory /></TabsContent>
        <TabsContent value="settings"><DashboardGoalsSettings onGoalsChange={q.fetchGoals} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default QueueMetricsDashboard;
