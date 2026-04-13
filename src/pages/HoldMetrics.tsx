import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, TrendingDown, AlertTriangle, Phone, Timer, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '@/hooks/usePageTitle';

interface AgentHoldMetrics {
  agentName: string;
  totalHoldTime: number;
  holdCount: number;
  avgHoldTime: number;
  totalCalls: number;
  holdPercentage: number;
}

interface DailyMetrics {
  date: string;
  totalHoldTime: number;
  holdCount: number;
  avgHoldTime: number;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function HoldMetrics() {
  usePageTitle('Métricas de Espera');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysBack));
  const endDate = endOfDay(new Date());

  const { data: holdEvents, isLoading: loadingHoldEvents } = useQuery({
    queryKey: ['holdEvents', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.from('hold_events').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: callSessions, isLoading: loadingCallSessions } = useQuery({
    queryKey: ['callSessionsWithHold', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.from('call_sessions').select('*').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agents').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const agentMetrics: AgentHoldMetrics[] = agents?.map(agent => {
    const agentSessions = callSessions?.filter(s => s.agent_name === agent.name) || [];
    const agentHoldEvents = holdEvents?.filter(h => h.agent_name === agent.name) || [];
    const totalHoldTime = agentHoldEvents.reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
    const holdCount = agentHoldEvents.length;
    const avgHoldTime = holdCount > 0 ? Math.round(totalHoldTime / holdCount) : 0;
    const totalCalls = agentSessions.length;
    const callsWithHold = new Set(agentHoldEvents.map(h => h.call_session_id)).size;
    const holdPercentage = totalCalls > 0 ? Math.round((callsWithHold / totalCalls) * 100) : 0;
    return { agentName: agent.name, totalHoldTime, holdCount, avgHoldTime, totalCalls, holdPercentage };
  }) || [];

  const dailyMetrics: DailyMetrics[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayEvents = holdEvents?.filter(h => { const d = new Date(h.created_at); return d >= dayStart && d <= dayEnd; }) || [];
    const totalHoldTime = dayEvents.reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
    const holdCount = dayEvents.length;
    dailyMetrics.push({ date: format(day, 'dd/MM', { locale: ptBR }), totalHoldTime, holdCount, avgHoldTime: holdCount > 0 ? Math.round(totalHoldTime / holdCount) : 0 });
  }

  const totalHoldTimeOverall = holdEvents?.reduce((sum, h) => sum + (h.duration_seconds || 0), 0) || 0;
  const totalHoldCountOverall = holdEvents?.length || 0;
  const avgHoldTimeOverall = totalHoldCountOverall > 0 ? Math.round(totalHoldTimeOverall / totalHoldCountOverall) : 0;
  const totalCallsOverall = callSessions?.length || 0;
  const callsWithHoldOverall = new Set(holdEvents?.map(h => h.call_session_id)).size;
  const holdRateOverall = totalCallsOverall > 0 ? Math.round((callsWithHoldOverall / totalCallsOverall) * 100) : 0;
  const sortedByAvg = [...agentMetrics].sort((a, b) => a.avgHoldTime - b.avgHoldTime);
  const bestPerformer = sortedByAvg.find(a => a.holdCount > 0);
  const worstPerformer = sortedByAvg.filter(a => a.holdCount > 0).pop();
  const isLoading = loadingHoldEvents || loadingCallSessions;
  const pieData = agentMetrics.filter(a => a.totalHoldTime > 0).slice(0, 5).map(a => ({ name: a.agentName, value: a.totalHoldTime }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-foreground">Métricas de Espera</h1><p className="text-muted-foreground">Análise de tempo em hold por agente e período</p></div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as '7d' | '30d' | '90d')}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">Últimos 7 dias</SelectItem><SelectItem value="30d">Últimos 30 dias</SelectItem><SelectItem value="90d">Últimos 90 dias</SelectItem></SelectContent></Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tempo Total em Espera</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatDuration(totalHoldTimeOverall)}</div><p className="text-xs text-muted-foreground">em {totalCallsOverall} chamadas</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Média por Chamada</CardTitle><Timer className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatDuration(avgHoldTimeOverall)}</div><p className="text-xs text-muted-foreground">{totalHoldCountOverall} vezes em hold</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Hold</CardTitle><Phone className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{holdRateOverall}%</div><p className="text-xs text-muted-foreground">das chamadas usaram hold</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{agentMetrics.filter(a => a.totalCalls > 0).length}</div><p className="text-xs text-muted-foreground">com chamadas no período</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {bestPerformer && <Card className="border-success/30 bg-success/5"><CardHeader className="flex flex-row items-center gap-3 pb-2"><div className="rounded-full bg-success/20 p-2"><TrendingDown className="h-5 w-5 text-success" /></div><div><CardTitle className="text-sm font-medium">Menor Tempo Médio</CardTitle><CardDescription>Melhor performance em espera</CardDescription></div></CardHeader><CardContent><div className="flex items-center justify-between"><span className="text-lg font-semibold">{bestPerformer.agentName}</span><Badge variant="outline" className="bg-success/10 text-success border-success/30">{formatDuration(bestPerformer.avgHoldTime)} média</Badge></div></CardContent></Card>}
        {worstPerformer && worstPerformer !== bestPerformer && <Card className="border-warning/30 bg-warning/5"><CardHeader className="flex flex-row items-center gap-3 pb-2"><div className="rounded-full bg-warning/20 p-2"><AlertTriangle className="h-5 w-5 text-warning" /></div><div><CardTitle className="text-sm font-medium">Maior Tempo Médio</CardTitle><CardDescription>Precisa de atenção</CardDescription></div></CardHeader><CardContent><div className="flex items-center justify-between"><span className="text-lg font-semibold">{worstPerformer.agentName}</span><Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">{formatDuration(worstPerformer.avgHoldTime)} média</Badge></div></CardContent></Card>}
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList><TabsTrigger value="agents">Por Agente</TabsTrigger><TabsTrigger value="timeline">Linha do Tempo</TabsTrigger><TabsTrigger value="distribution">Distribuição</TabsTrigger></TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Tempo em Espera por Agente</CardTitle><CardDescription>Comparativo de tempo total e médio de hold</CardDescription></CardHeader><CardContent>
            {isLoading ? <div className="h-80 flex items-center justify-center text-muted-foreground">Carregando dados...</div> : agentMetrics.length === 0 ? <div className="h-80 flex items-center justify-center text-muted-foreground">Nenhum dado disponível para o período</div> : (
              <ResponsiveContainer width="100%" height={350}><BarChart data={agentMetrics.filter(a => a.holdCount > 0)}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="agentName" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={((value: number) => [formatDuration(value), ''] as [string, string]) as any} /><Bar dataKey="totalHoldTime" name="Tempo Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /><Bar dataKey="avgHoldTime" name="Tempo Médio" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
            )}
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Detalhes por Agente</CardTitle></CardHeader><CardContent><div className="space-y-4">
            {agentMetrics.sort((a, b) => b.totalHoldTime - a.totalHoldTime).map((agent) => (
              <div key={agent.agentName} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{agent.agentName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between"><span className="font-medium">{agent.agentName}</span><div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{agent.totalCalls} chamadas</Badge><Badge variant="secondary" className="text-xs">{agent.holdCount} holds</Badge></div></div>
                  <div className="flex items-center gap-2"><Progress value={agent.holdPercentage} className="flex-1 h-2" /><span className="text-xs text-muted-foreground w-16 text-right">{formatDuration(agent.avgHoldTime)} avg</span></div>
                </div>
              </div>
            ))}
          </div></CardContent></Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card><CardHeader><CardTitle>Evolução do Tempo em Espera</CardTitle><CardDescription>Tendência diária de uso de hold</CardDescription></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={350}><LineChart data={dailyMetrics}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={((value: number, name: string) => [name === 'holdCount' ? value : formatDuration(value), name === 'holdCount' ? 'Quantidade' : name === 'avgHoldTime' ? 'Tempo Médio' : 'Tempo Total'] as [string | number, string]) as any} /><Line type="monotone" dataKey="avgHoldTime" name="avgHoldTime" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} /><Line type="monotone" dataKey="holdCount" name="holdCount" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-2))' }} /></LineChart></ResponsiveContainer>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Distribuição por Agente</CardTitle><CardDescription>Proporção de tempo em hold</CardDescription></CardHeader><CardContent>
              {pieData.length > 0 ? (<ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={((props: { name?: string; percent?: number }) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as unknown as boolean}>{pieData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip formatter={((value: number) => [formatDuration(value), 'Tempo Total']) as any} /></PieChart></ResponsiveContainer>) : <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados para exibir</div>}
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Taxa de Hold por Agente</CardTitle><CardDescription>% de chamadas com espera</CardDescription></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}><BarChart data={agentMetrics.filter(a => a.totalCalls > 0)} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis type="number" domain={[0, 100]} /><YAxis dataKey="agentName" type="category" width={100} className="text-xs" /><Tooltip formatter={((value: number) => [`${value}%`, 'Taxa de Hold']) as any} /><Bar dataKey="holdPercentage" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
