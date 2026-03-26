import { Phone, Clock, CheckCircle, Users, Activity, Zap } from 'lucide-react';
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
import { useDashboardStats } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Index = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6 relative">
      {/* Ambient neon mesh background */}
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-40" />

      {/* Header */}
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu centro de atendimento</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-neon">
          <Zap className="h-3.5 w-3.5 text-primary animate-glow-pulse" />
          <span className="text-xs font-semibold text-primary">Sistema ativo</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="relative grid gap-4 grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-[130px] rounded-xl" />
            ))}
          </>
        ) : stats ? (
          <>
            <StatsCard
              title="Chamadas Hoje"
              value={stats.totalCallsToday}
              change={stats.totalCallsChange}
              changeLabel="vs ontem"
              icon={<Phone className="h-5 w-5" />}
              glowColor="primary"
            />
            <StatsCard
              title="Duração Média"
              value={formatDuration(stats.avgCallDuration)}
              change={stats.durationChange}
              changeLabel="vs ontem"
              icon={<Clock className="h-5 w-5" />}
              glowColor="info"
            />
            <StatsCard
              title="Taxa Atendimento"
              value={`${stats.answeredRate}%`}
              change={stats.rateChange}
              changeLabel="vs ontem"
              icon={<CheckCircle className="h-5 w-5" />}
              glowColor="success"
            />
            <StatsCard
              title="Agentes Ativos"
              value={`${stats.activeAgents}/${stats.totalAgents}`}
              icon={<Users className="h-5 w-5" />}
              glowColor="warning"
            />
          </>
        ) : null}
      </div>

      {/* Active Calls & Hold Trend */}
      <div className="relative grid gap-4 lg:grid-cols-2">
        <ActiveCallsRealtime />
        <HoldTrendChart />
      </div>

      {/* Charts and Queue */}
      <div className="relative grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CallVolumeChart />
        </div>
        <QueueStatus />
      </div>

      {/* Callbacks & Supervisor */}
      <div className="relative grid gap-4 lg:grid-cols-2">
        <ScheduledCallbacksList />
        <SupervisorPanel />
      </div>

      {/* Recent & Agents */}
      <div className="relative grid gap-4 lg:grid-cols-2">
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
