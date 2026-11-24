import { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useExecutiveDashboardData, type PeriodType } from '@/hooks/useExecutiveDashboard';
import { KPICardsRow1, KPICardsRow2, HoldKPICards } from '@/components/executive/KPICards';
import {
  CallsVolumeChart, SatisfactionChart, SentimentChart,
  HoldByAgentChart, TopAgentsChart,
} from '@/components/executive/DashboardCharts';
import { GoalsComparisonSection } from '@/components/executive/GoalsComparisonSection';
import { ConversationIntelligenceCard } from '@/components/executive/ConversationIntelligenceCard';
import { ForecastCard } from '@/components/executive/ForecastCard';
import { CustomerSuccessCard } from '@/components/executive/CustomerSuccessCard';
import { VolumeForecastCard } from '@/components/executive/VolumeForecastCard';
import { MeetingSummaryDashboardCard } from '@/components/executive/MeetingSummaryDashboardCard';
import { AgentAssistDashboardCard } from '@/components/executive/AgentAssistDashboardCard';
import { OutboundComplianceCard } from '@/components/executive/OutboundComplianceCard';
import { MultilingualDashboardCard } from '@/components/executive/MultilingualDashboardCard';
import { OmnichannelCard } from '@/components/executive/OmnichannelCard';
import { PendingFollowupsCard } from '@/components/executive/PendingFollowupsCard';
import { usePageTitle } from '@/hooks/usePageTitle';
import { EmptyErrorState } from '@/components/ui/empty-state';

export default function ExecutiveDashboard() {
  usePageTitle('Dashboard Executivo');

  const [period, setPeriod] = useState<PeriodType>('week');
  const {
    metrics, callsByDay, satisfactionTrend, sentimentData,
    topAgents, goalsComparison, holdByAgent, isLoading, error, lastUpdate, refetch,
  } = useExecutiveDashboardData(period);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <EmptyErrorState
          title="Não foi possível carregar o dashboard"
          description="A leitura das métricas falhou — os números não foram zerados para não parecer que não houve chamada."
          hint={error}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">Visão consolidada de todas as métricas do call center</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-pulse text-green-500" />
            <span>Atualizado: {format(lastUpdate, 'HH:mm:ss', { locale: ptBR })}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger className="w-[180px] max-w-full">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <KPICardsRow1 metrics={metrics} period={period} />
      <KPICardsRow2 metrics={metrics} period={period} />
      <HoldKPICards metrics={metrics} />

      <ConversationIntelligenceCard />
      <ForecastCard />
      <CustomerSuccessCard />
      <VolumeForecastCard />
      <MeetingSummaryDashboardCard />
      <AgentAssistDashboardCard />
      <OutboundComplianceCard />
      <MultilingualDashboardCard />
      <OmnichannelCard />
      <PendingFollowupsCard />

      <div className="grid gap-6 lg:grid-cols-2">
        <CallsVolumeChart data={callsByDay} />
        <SatisfactionChart data={satisfactionTrend} />
        <SentimentChart data={sentimentData} />
        <HoldByAgentChart data={holdByAgent} />
      </div>

      <TopAgentsChart data={topAgents} />
      <GoalsComparisonSection data={goalsComparison} />
    </div>
  );
}
