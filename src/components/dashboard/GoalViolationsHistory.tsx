import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, AlertCircle, RefreshCw, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGoalViolations, METRIC_LABELS } from '@/hooks/useGoalViolations';

const COLORS = {
  warning: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))',
  chart: ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--success))'],
};

export const GoalViolationsHistory = () => {
  const {
    violations, loading, dateRange, setDateRange,
    dailyTrends, metricBreakdown,
    totalViolations, criticalCount, warningCount,
    formatValue, fetchViolations,
  } = useGoalViolations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Histórico de Violações</h2><p className="text-sm text-muted-foreground">Acompanhe as violações de metas ao longo do tempo</p></div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger className="w-40"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="14">Últimos 14 dias</SelectItem><SelectItem value="30">Últimos 30 dias</SelectItem><SelectItem value="60">Últimos 60 dias</SelectItem></SelectContent></Select>
          <Button onClick={fetchViolations} disabled={loading} size="sm" variant="outline"><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total de Violações</p><p className="text-3xl font-bold">{totalViolations}</p></div><div className="p-3 rounded-full bg-muted"><BarChart3 className="h-6 w-6 text-muted-foreground" /></div></div></CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Violações Críticas</p><p className="text-3xl font-bold text-destructive">{criticalCount}</p></div><div className="p-3 rounded-full bg-destructive/20"><AlertCircle className="h-6 w-6 text-destructive" /></div></div></CardContent></Card>
        <Card className="border-warning/30"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avisos</p><p className="text-3xl font-bold text-warning">{warningCount}</p></div><div className="p-3 rounded-full bg-warning/20"><AlertTriangle className="h-6 w-6 text-warning" /></div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5" />Tendência Diária</CardTitle></CardHeader><CardContent>
          {dailyTrends.length > 0 ? (<ResponsiveContainer width="100%" height={300}><BarChart data={dailyTrends}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /><Bar dataKey="warning" name="Avisos" fill={COLORS.warning} radius={[4, 4, 0, 0]} /><Bar dataKey="critical" name="Críticas" fill={COLORS.critical} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>) : (<div className="h-[300px] flex items-center justify-center text-muted-foreground">Nenhuma violação no período</div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5" />Violações por Métrica</CardTitle></CardHeader><CardContent>
          {metricBreakdown.length > 0 ? (<ResponsiveContainer width="100%" height={300}><PieChart><Pie data={metricBreakdown} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={({ label, percent }: { label?: string; percent?: number }) => `${label} (${((percent || 0) * 100).toFixed(0)}%)`} labelLine={false}>{metricBreakdown.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS.chart[i % COLORS.chart.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /></PieChart></ResponsiveContainer>) : (<div className="h-[300px] flex items-center justify-center text-muted-foreground">Nenhuma violação no período</div>)}
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-lg">Tendência Cumulativa</CardTitle></CardHeader><CardContent>
        {dailyTrends.length > 0 ? (<ResponsiveContainer width="100%" height={250}><LineChart data={dailyTrends}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} /></LineChart></ResponsiveContainer>) : (<div className="h-[250px] flex items-center justify-center text-muted-foreground">Nenhuma violação no período</div>)}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="text-lg">Violações Recentes</CardTitle></CardHeader><CardContent>
        {violations.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {violations.slice(0, 50).map(v => (
              <div key={v.id} className={`p-4 rounded-lg border ${v.threshold_type === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">{v.threshold_type === 'critical' ? <AlertCircle className="h-5 w-5 text-destructive" /> : <AlertTriangle className="h-5 w-5 text-warning" />}<div><p className="font-medium">{v.goal_name}</p><p className="text-sm text-muted-foreground">{METRIC_LABELS[v.metric_type] || v.metric_type}</p></div></div>
                  <div className="text-right"><Badge variant={v.threshold_type === 'critical' ? 'destructive' : 'outline'}>{v.threshold_type === 'critical' ? 'Crítico' : 'Aviso'}</Badge><p className="text-xs text-muted-foreground mt-1">{format(new Date(v.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p></div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span><span className="text-muted-foreground">Atual:</span> <span className="font-medium">{formatValue(v.actual_value, v.metric_type)}</span></span>
                  <span><span className="text-muted-foreground">Meta:</span> <span className="font-medium">{formatValue(v.target_value, v.metric_type)}</span></span>
                  {v.deviation_percentage !== null && <span><span className="text-muted-foreground">Desvio:</span> <span className={`font-medium ${v.threshold_type === 'critical' ? 'text-destructive' : 'text-warning'}`}>{v.deviation_percentage.toFixed(1)}%</span></span>}
                </div>
              </div>
            ))}
          </div>
        ) : (<div className="h-[200px] flex items-center justify-center text-muted-foreground">Nenhuma violação no período</div>)}
      </CardContent></Card>
    </div>
  );
};
