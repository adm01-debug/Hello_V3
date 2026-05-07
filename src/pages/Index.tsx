import { Phone, Clock, CheckCircle, Users, Zap, LayoutDashboard } from 'lucide-react';
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
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Index = () => {
  usePageTitle('Dashboard');
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <main className="space-y-12 relative pb-12" aria-label="Dashboard principal">
      {/* Refined Ambient Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px] opacity-50" />
      </div>

      {/* Header */}
      <NeonPageHeader
        title="Dashboard"
        description="Visão geral do seu centro de atendimento"
        icon={<LayoutDashboard className="h-5 w-5" />}
        badge={
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-neon" aria-label="Status do sistema: ativo">
            <Zap className="h-3.5 w-3.5 text-primary animate-glow-pulse" aria-hidden="true" />
            <span className="text-xs font-semibold text-primary">Sistema ativo</span>
          </div>
        }
      />

      {/* Stats Grid - Premium Layout */}
      <section className="relative grid gap-6 grid-cols-2 lg:grid-cols-4" aria-label="Métricas principais">
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

      {/* Main Insights Grid */}
      <SectionBoundary section="Monitoramento de Operação">
        <section className="relative grid gap-6 lg:grid-cols-12" aria-label="Chamadas ativas e tendência de espera">
          <div className="lg:col-span-7">
            <ActiveCallsRealtime />
          </div>
          <div className="lg:col-span-5">
            <HoldTrendChart />
          </div>
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
