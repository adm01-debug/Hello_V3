import { Phone, Clock, CheckCircle, Users, Zap } from 'lucide-react';
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
import { SectionBoundary } from '@/components/error-boundary/ErrorBoundary';
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
    <main className="space-y-6 relative" aria-label="Dashboard principal">
      {/* Ambient neon mesh background */}
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-40" aria-hidden="true" />

      {/* Header */}
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu centro de atendimento</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-neon" aria-label="Status do sistema: ativo">
          <Zap className="h-3.5 w-3.5 text-primary animate-glow-pulse" aria-hidden="true" />
          <span className="text-xs font-semibold text-primary">Sistema ativo</span>
        </div>
      </div>

      {/* Stats Cards */}
      <SectionBoundary section="Estatísticas">
        <section className="relative grid gap-4 grid-cols-2 lg:grid-cols-4" aria-label="Métricas principais">
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
        </section>
      </SectionBoundary>

      {/* Active Calls & Hold Trend */}
      <SectionBoundary section="Chamadas Ativas">
        <section className="relative grid gap-4 lg:grid-cols-2" aria-label="Chamadas ativas e tendência de espera">
          <ActiveCallsRealtime />
          <HoldTrendChart />
        </section>
      </SectionBoundary>

      {/* Charts and Queue */}
      <SectionBoundary section="Volume e Fila">
        <section className="relative grid gap-4 lg:grid-cols-3" aria-label="Volume de chamadas e fila de atendimento">
          <div className="lg:col-span-2">
            <CallVolumeChart />
          </div>
          <QueueStatus />
        </section>
      </SectionBoundary>

      {/* Callbacks & Supervisor */}
      <SectionBoundary section="Callbacks e Supervisão">
        <section className="relative grid gap-4 lg:grid-cols-2" aria-label="Callbacks agendados e painel do supervisor">
          <ScheduledCallbacksList />
          <SupervisorPanel />
        </section>
      </SectionBoundary>

      {/* Recent & Agents */}
      <SectionBoundary section="Chamadas Recentes">
        <section className="relative grid gap-4 lg:grid-cols-2" aria-label="Chamadas recentes e lista de agentes">
          <RecentCalls />
          <AgentsList />
        </section>
      </SectionBoundary>

      {/* Agent Notifications */}
      <WhisperNotification agentName="Carlos Silva" />
      <BargeInNotification agentName="Carlos Silva" />
    </main>
  );
};

export default Index;
