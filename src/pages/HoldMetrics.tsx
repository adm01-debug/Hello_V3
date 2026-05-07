import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, TrendingDown, AlertTriangle, Phone, Timer, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useHoldMetrics } from '@/hooks/useHoldMetrics';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

export default function HoldMetrics() {
  usePageTitle('Métricas de Espera');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const {
    agentMetrics, dailyMetrics, pieData,
    totalHoldTimeOverall, totalHoldCountOverall, avgHoldTimeOverall,
    totalCallsOverall, holdRateOverall,
    bestPerformer, worstPerformer, isLoading,
  } = useHoldMetrics(dateRange);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Métricas de Espera</h1>
          <p className="text-muted-foreground">Análise de tempo em hold por agente e período</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as '7d' | '30d' | '90d')}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tempo Total em Espera</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatDuration(totalHoldTimeOverall)}</div><p className="text-xs text-muted-foreground">em {totalCallsOverall} chamadas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Média por Chamada</CardTitle><Timer className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatDuration(avgHoldTimeOverall)}</div><p className="text-xs text-muted-foreground">{totalHoldCountOverall} vezes em hold</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Hold</CardTitle><Phone className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{holdRateOverall}%</div><p className="text-xs text-muted-foreground">das chamadas usaram hold</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{agentMetrics.filter(a => a.totalCalls > 0).length}</div><p className="text-xs text-muted-foreground">com chamadas no período</p></CardContent>
        </Card>
      </div>

      {/* Performance Highlights */}
      <div className="grid gap-4 md:grid-cols-2">
        {bestPerformer && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="flex flex-row items-center gap-3 pb-2"><div className="rounded-full bg-success/20 p-2"><TrendingDown className="h-5 w-5 text-success" /></div><div><CardTitle className="text-sm font-medium">Menor Tempo Médio</CardTitle><CardDescription>Melhor performance em espera</CardDescription></div></CardHeader>
            <CardContent><div className="flex items-center justify-between"><span className="text-lg font-semibold">{bestPerformer.agentName}</span><Badge variant="outline" className="bg-success/10 text-success border-success/30">{formatDuration(bestPerformer.avgHoldTime)} média</Badge></div></CardContent>
          </Card>
        )}
        {worstPerformer && worstPerformer !== bestPerformer && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="flex flex-row items-center gap-3 pb-2"><div className="rounded-full bg-warning/20 p-2"><AlertTriangle className="h-5 w-5 text-warning" /></div><div><CardTitle className="text-sm font-medium">Maior Tempo Médio</CardTitle><CardDescription>Precisa de atenção</CardDescription></div></CardHeader>
            <CardContent><div className="flex items-center justify-between"><span className="text-lg font-semibold">{worstPerformer.agentName}</span><Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">{formatDuration(worstPerformer.avgHoldTime)} média</Badge></div></CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Por Agente</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Tempo em Espera por Agente</CardTitle><CardDescription>Comparativo de tempo total e médio de hold</CardDescription></CardHeader>
            <CardContent>
              {isLoading ? <div className="h-80 flex items-center justify-center text-muted-foreground">Carregando dados...</div>
              : agentMetrics.length === 0 ? <div className="h-80 flex items-center justify-center text-muted-foreground">Nenhum dado disponível para o período</div>
              : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={agentMetrics.filter(a => a.holdCount > 0)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="agentName" className="text-xs" /><YAxis className="text-xs" />
                     <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [formatDuration(value), '']} />
                    <Bar dataKey="totalHoldTime" name="Tempo Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgHoldTime" name="Tempo Médio" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Detalhes por Agente</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentMetrics.sort((a, b) => b.totalHoldTime - a.totalHoldTime).map((agent) => (
                  <div key={agent.agentName} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{agent.agentName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between"><span className="font-medium">{agent.agentName}</span><div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">{agent.totalCalls} chamadas</Badge><Badge variant="secondary" className="text-xs">{agent.holdCount} holds</Badge></div></div>
                      <div className="flex items-center gap-2"><Progress value={agent.holdPercentage} className="flex-1 h-2" /><span className="text-xs text-muted-foreground w-16 text-right">{formatDuration(agent.avgHoldTime)} avg</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Evolução do Tempo em Espera</CardTitle><CardDescription>Tendência diária de uso de hold</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis className="text-xs" />
                   <Tooltip 
                     contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                     formatter={(value: number, name: string) => [
                       name === 'holdCount' ? value : formatDuration(value), 
                       name === 'holdCount' ? 'Quantidade' : name === 'avgHoldTime' ? 'Tempo Médio' : 'Tempo Total'
                     ]} 
                   />
                  <Line type="monotone" dataKey="avgHoldTime" name="avgHoldTime" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  <Line type="monotone" dataKey="holdCount" name="holdCount" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-2))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Distribuição por Agente</CardTitle><CardDescription>Proporção do tempo em espera</CardDescription></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                       <Pie 
                         data={pieData} 
                         dataKey="value" 
                         nameKey="name" 
                         cx="50%" 
                         cy="50%" 
                         outerRadius={100} 
                         label={({ name, percent }: { name: string, percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`} 
                         labelLine={false}
                       >
                        {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                       <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [formatDuration(value), 'Tempo Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados para o período</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Ranking de Hold</CardTitle><CardDescription>Agentes ordenados por tempo total</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentMetrics.filter(a => a.totalHoldTime > 0).sort((a, b) => b.totalHoldTime - a.totalHoldTime).slice(0, 5).map((agent, index) => (
                    <div key={agent.agentName} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                      <div className="flex-1"><p className="font-medium">{agent.agentName}</p><p className="text-xs text-muted-foreground">{agent.holdCount} holds • {formatDuration(agent.avgHoldTime)} média</p></div>
                      <Badge variant="outline">{formatDuration(agent.totalHoldTime)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
