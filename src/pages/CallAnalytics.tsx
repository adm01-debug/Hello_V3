import {
  BarChart3, Phone, Clock, Users, Tag, Star, Loader2, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCallAnalytics, type DateRange } from '@/hooks/useCallAnalytics';

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function CallAnalytics() {
  usePageTitle('Analytics de Chamadas');

  const { isLoading, dateRange, setDateRange, stats, sentimentChartData } = useCallAnalytics();

  if (isLoading) {
    return (<div className="flex items-center justify-center h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>);
  }

  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      <div className="relative space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Analytics de Chamadas</h1>
            <p className="text-muted-foreground">Estatísticas e insights das chamadas atendidas</p>
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px]"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total de Chamadas</CardTitle><Phone className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalCalls}</div><p className="text-xs text-muted-foreground">{stats.summariesCount} com resumo IA</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Duração Média</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div><p className="text-xs text-muted-foreground">por chamada</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Satisfação Média</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgSatisfaction.toFixed(1)}/10</div><Progress value={stats.avgSatisfaction * 10} className="mt-2" /></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Performance Agentes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgPerformance.toFixed(1)}/10</div><Progress value={stats.avgPerformance * 10} className="mt-2" /></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Chamadas por Dia</CardTitle><CardDescription>Últimos 7 dias</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.callsByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Distribuição de Sentimento</CardTitle><CardDescription>Análise geral das chamadas</CardDescription></CardHeader>
            <CardContent>
              {sentimentChartData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={sentimentChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">{sentimentChartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /></PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (<div className="h-[250px] flex items-center justify-center text-muted-foreground">Sem dados de sentimento disponíveis</div>)}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Detalhes de Sentimento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(['positive', 'neutral', 'negative'] as const).map(key => {
                const labels = { positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo' };
                const colors = { positive: 'success', neutral: 'warning', negative: 'destructive' };
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className={`h-3 w-3 rounded-full bg-${colors[key]}`} /><span className="text-sm">{labels[key]}</span></div>
                    <div className="flex items-center gap-2"><span className="font-medium">{stats.sentimentCounts[key]}</span><Badge variant="outline" className={`text-${colors[key]}`}>{stats.summariesCount > 0 ? `${Math.round((stats.sentimentCounts[key] / stats.summariesCount) * 100)}%` : '0%'}</Badge></div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4" />Tópicos Mais Frequentes</CardTitle></CardHeader>
            <CardContent>
              {stats.topTopics.length > 0 ? (
                <div className="space-y-3">
                  {stats.topTopics.map(([topic, count], index) => {
                    const maxCount = stats.topTopics[0][1];
                    return (
                      <div key={topic} className="space-y-1">
                        <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="text-muted-foreground w-5">{index + 1}.</span>{topic}</span><Badge variant="secondary">{count}</Badge></div>
                        <Progress value={(count / maxCount) * 100} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (<div className="text-center text-muted-foreground py-8">Sem dados de tópicos disponíveis</div>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
