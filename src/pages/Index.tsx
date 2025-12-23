import { Phone, Clock, CheckCircle, Users } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CallVolumeChart } from '@/components/dashboard/CallVolumeChart';
import { RecentCalls } from '@/components/dashboard/RecentCalls';
import { AgentsList } from '@/components/dashboard/AgentsList';
import { QueueStatus } from '@/components/dashboard/QueueStatus';
import { ActiveCallsRealtime } from '@/components/dashboard/ActiveCallsRealtime';
import { mockDashboardStats, formatDuration } from '@/data/mockData';

const Index = () => {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu centro de atendimento</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Chamadas Hoje"
          value={stats.totalCallsToday}
          change={stats.totalCallsChange}
          changeLabel="vs ontem"
          icon={<Phone className="h-6 w-6" />}
        />
        <StatsCard
          title="Duração Média"
          value={formatDuration(stats.avgCallDuration)}
          change={stats.durationChange}
          changeLabel="vs ontem"
          icon={<Clock className="h-6 w-6" />}
        />
        <StatsCard
          title="Taxa de Atendimento"
          value={`${stats.answeredRate}%`}
          change={stats.rateChange}
          changeLabel="vs ontem"
          icon={<CheckCircle className="h-6 w-6" />}
        />
        <StatsCard
          title="Agentes Ativos"
          value={`${stats.activeAgents}/${stats.totalAgents}`}
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      {/* Active Calls Realtime */}
      <ActiveCallsRealtime />

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CallVolumeChart />
        </div>
        <div>
          <QueueStatus />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentCalls />
        <AgentsList />
      </div>
    </div>
  );
};

export default Index;
