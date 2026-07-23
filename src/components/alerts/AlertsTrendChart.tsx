import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import type { Formatter, ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { safeParseInt } from '@/lib/safe-number';

interface AlertData {
  id: string;
  created_at: string;
  severity: string;
  alert_type: string;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  critical: number;
  warning: number;
  info: number;
  total: number;
}

interface TypeChartDataPoint {
  type: string;
  typeLabel: string;
  count: number;
  fill: string;
}

export function AlertsTrendChart() {
  const [callAlerts, setCallAlerts] = useState<AlertData[]>([]);
  const [contactAlerts, setContactAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7');
  const [chartType, setChartType] = useState<'trend' | 'type'>('trend');
  const [alertSource, setAlertSource] = useState<'all' | 'contacts' | 'calls'>('all');

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    const daysAgo = parseInt(dateRange);
    const startDate = subDays(new Date(), daysAgo).toISOString();

    const [callRes, contactRes] = await Promise.all([
      supabase
        .from('call_alerts')
        .select('id, created_at, severity, alert_type')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true }),
      supabase
        .from('contact_alerts')
        .select('id, created_at, severity, alert_type')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true })
    ]);

    if (!callRes.error) setCallAlerts(callRes.data || []);
    if (!contactRes.error) setContactAlerts(contactRes.data || []);
    setIsLoading(false);
  };

  const filteredAlerts = useMemo(() => {
    if (alertSource === 'all') return [...callAlerts, ...contactAlerts];
    if (alertSource === 'contacts') return contactAlerts;
    return callAlerts;
  }, [callAlerts, contactAlerts, alertSource]);

  const trendData = useMemo(() => {
    const daysAgo = parseInt(dateRange);
    const dateInterval = eachDayOfInterval({
      start: subDays(new Date(), daysAgo - 1),
      end: new Date()
    });

    return dateInterval.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayAlerts = filteredAlerts.filter(alert => {
        const alertDate = parseISO(alert.created_at);
        return alertDate >= dayStart && alertDate < dayEnd;
      });

      const critical = dayAlerts.filter(a => a.severity === 'critical').length;
      const warning = dayAlerts.filter(a => a.severity === 'warning').length;
      const info = dayAlerts.filter(a => a.severity === 'info').length;

      return {
        date: format(day, 'yyyy-MM-dd'),
        dateLabel: format(day, 'dd/MM', { locale: ptBR }),
        critical,
        warning,
        info,
        total: critical + warning + info
      } as ChartDataPoint;
    });
  }, [filteredAlerts, dateRange]);

  const typeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    
    filteredAlerts.forEach(alert => {
      const type = alert.alert_type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const typeLabels: Record<string, string> = {
      negative_sentiment: 'Sentimento Negativo',
      low_satisfaction: 'Baixa Satisfação',
      high_urgency: 'Alta Urgência',
      buying_signal: 'Sinal de Compra',
      low_engagement: 'Baixo Engajamento',
      inactive_vip: 'VIP Inativo',
    };

    const typeColors: Record<string, string> = {
      negative_sentiment: 'hsl(var(--destructive))',
      low_satisfaction: 'hsl(45, 93%, 47%)',
      high_urgency: 'hsl(var(--destructive))',
      buying_signal: 'hsl(var(--success))',
      low_engagement: 'hsl(var(--muted-foreground))',
      inactive_vip: 'hsl(280, 70%, 50%)',
    };

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        typeLabel: typeLabels[type] || type,
        count,
        fill: typeColors[type] || 'hsl(var(--primary))'
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredAlerts]);

  const totalAlerts = trendData.reduce((sum, day) => sum + day.total, 0);
  const avgPerDay = totalAlerts > 0 ? (totalAlerts / parseInt(dateRange)).toFixed(1) : '0';
  const criticalTotal = trendData.reduce((sum, day) => sum + day.critical, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendência de Alertas
          </CardTitle>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{totalAlerts}</strong> alertas no período</span>
            <span><strong className="text-foreground">{avgPerDay}</strong> média/dia</span>
            <span><strong className="text-destructive">{criticalTotal}</strong> críticos</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'trend' | 'type')}>
            <TabsList className="h-8">
              <TabsTrigger value="trend" className="text-xs px-2">
                <TrendingUp className="h-3 w-3 mr-1" /> Tendência
              </TabsTrigger>
              <TabsTrigger value="type" className="text-xs px-2">
                <BarChart3 className="h-3 w-3 mr-1" /> Por Tipo
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={alertSource} onValueChange={(v) => setAlertSource(v as 'all' | 'contacts' | 'calls')}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="contacts">Contatos</SelectItem>
              <SelectItem value="calls">Chamadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as '7' | '14' | '30')}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="14">14 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        ) : chartType === 'trend' ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInfo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={((value, name) => {
                    const labels: Record<string, string> = {
                      critical: 'Críticos',
                      warning: 'Avisos',
                      info: 'Informativos'
                    };
                    return [value, labels[name as string] || name] as [typeof value, typeof name];
                  }) as Formatter<ValueType, NameType>}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      critical: 'Críticos',
                      warning: 'Avisos',
                      info: 'Informativos'
                    };
                    return <span className="text-sm text-muted-foreground">{labels[value] || value}</span>;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCritical)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="warning"
                  stroke="hsl(45, 93%, 47%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorWarning)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="info"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInfo)"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px]">
            {typeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhum alerta no período selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="typeLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={((value) => [value, 'Alertas'] as [typeof value, string]) as Formatter<ValueType, NameType>}
                    labelFormatter={(label) => label}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]}
                    fill="hsl(var(--primary))"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
