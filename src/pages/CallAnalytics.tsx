import { usePageTitle } from '@/hooks/usePageTitle';
import { useCallAnalytics } from '@/hooks/useCallAnalytics';
import { Loader2 } from 'lucide-react';
import { AnalyticsHeader } from './call-analytics/AnalyticsHeader';
import { CallsByDayChart } from './call-analytics/CallsByDayChart';
import { KpiCards } from './call-analytics/KpiCards';
import { SentimentBreakdown } from './call-analytics/SentimentBreakdown';
import { SentimentPieChart } from './call-analytics/SentimentPieChart';
import { TopTopicsList } from './call-analytics/TopTopicsList';

export default function CallAnalytics() {
  usePageTitle('Analytics de Chamadas');
  const { isLoading, dateRange, setDateRange, stats, sentimentChartData } = useCallAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      <div className="relative space-y-6">
        <AnalyticsHeader dateRange={dateRange} onChange={setDateRange} />

        <KpiCards
          totalCalls={stats.totalCalls}
          summariesCount={stats.summariesCount}
          avgDuration={stats.avgDuration}
          avgSatisfaction={stats.avgSatisfaction}
          avgPerformance={stats.avgPerformance}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CallsByDayChart data={stats.callsByDay} />
          <SentimentPieChart data={sentimentChartData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SentimentBreakdown counts={stats.sentimentCounts} summariesCount={stats.summariesCount} />
          <TopTopicsList topics={stats.topTopics} />
        </div>
      </div>
    </div>
  );
}
