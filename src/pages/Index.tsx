import { Phone, Clock, CheckCircle, Users, Activity } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CallVolumeChart } from '@/components/dashboard/CallVolumeChart';
import { RecentCalls } from '@/components/dashboard/RecentCalls';
import { AgentsList } from '@/components/dashboard/AgentsList';
import { QueueStatus } from '@/components/dashboard/QueueStatus';
import { ActiveCallsRealtime } from '@/components/dashboard/ActiveCallsRealtime';
import { HoldTrendChart } from '@/components/dashboard/HoldTrendChart';
import { SupervisorPanel } from '@/components/supervisor/SupervisorPanel';
import { WhisperNotification } from '@/components/agent/WhisperNotification';
import { BargeInNotification } from '@/components/agent/BargeInNotification';
import { ScheduledCallbacksList } from '@/components/callbacks/ScheduledCallbacksList';
import { mockDashboardStats, formatDuration } from '@/data/mockData';

const Index = () => {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu centro de atendimento</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <Activity className="h-3.5 w-3.5 text-success animate-pulse" />
          <span className="text-xs font-medium text-success">Sistema ativo</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Chamadas Hoje"
          value={stats.totalCallsToday}
          change={stats.totalCallsChange}
          changeLabel="vs ontem"
          icon={<Phone className="h-5 w-5" />}
        />
        <StatsCard
          title="Duração Média"
          value={formatDuration(stats.avgCallDuration)}
          change={stats.durationChange}
          changeLabel="vs ontem"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatsCard
          title="Taxa Atendimento"
          value={`${stats.answeredRate}%`}
          change={stats.rateChange}
          changeLabel="vs ontem"
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatsCard
          title="Agentes Ativos"
          value={`${stats.activeAgents}/${stats.totalAgents}`}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Active Calls & Hold Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ActiveCallsRealtime />
        <HoldTrendChart />
      </div>

      {/* Charts and Queue */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CallVolumeChart />
        </div>
        <QueueStatus />
      </div>

      {/* Callbacks & Supervisor */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ScheduledCallbacksList />
        <SupervisorPanel />
      </div>

      {/* Recent & Agents */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentCalls />
        <AgentsList />
      </div>

      {/* Agent Notifications */}
      <WhisperNotification agentName="Carlos Silva" />
      <BargeInNotification agentName="Carlos Silva" />
    </div>
  );
};

export default Index;
