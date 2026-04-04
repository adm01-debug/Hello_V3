import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Calendar as CalendarIcon, 
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  alert_type: string;
  created_at: string;
  is_read: boolean;
  call_session_id: string;
}

interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  readRate: number;
}

const SEVERITY_COLORS = {
  critical: 'hsl(var(--destructive))',
  warning: 'hsl(var(--warning))',
  info: 'hsl(var(--primary))',
};

const AlertHistory = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    readRate: 0,
  });
  const [alertTypes, setAlertTypes] = useState<string[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('call_alerts')
        .select('*')
        .gte('created_at', startOfDay(dateRange.from).toISOString())
        .lte('created_at', endOfDay(dateRange.to).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const alertsData = data || [];
      setAlerts(alertsData);

      // Calculate stats
      const critical = alertsData.filter(a => a.severity === 'critical').length;
      const warning = alertsData.filter(a => a.severity === 'warning').length;
      const info = alertsData.filter(a => a.severity === 'info').length;
      const readCount = alertsData.filter(a => a.is_read).length;

      setStats({
        total: alertsData.length,
        critical,
        warning,
        info,
        readRate: alertsData.length > 0 ? (readCount / alertsData.length) * 100 : 0,
      });

      // Get unique alert types
      const types = [...new Set(alertsData.map(a => a.alert_type))];
      setAlertTypes(types);

      // Calculate daily stats
      const dailyMap = new Map<string, { critical: number; warning: number; info: number }>();
      alertsData.forEach(alert => {
        const day = format(new Date(alert.created_at), 'dd/MM');
        const current = dailyMap.get(day) || { critical: 0, warning: 0, info: 0 };
        current[alert.severity as keyof typeof current]++;
        dailyMap.set(day, current);
      });

      const dailyData = Array.from(dailyMap.entries()).map(([date, counts]) => ({
        date,
        ...counts,
        total: counts.critical + counts.warning + counts.info,
      })).reverse();

      setDailyStats(dailyData);
    } catch (error) {
      logger.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [dateRange]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.alert_type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'destructive' | 'outline' | 'default'> = {
      critical: 'destructive',
      warning: 'outline',
      info: 'default',
    };
    return (
      <Badge variant={variants[severity] || 'default'} className={severity === 'warning' ? 'border-warning text-warning' : ''}>
        {severity === 'critical' ? 'Crítico' : severity === 'warning' ? 'Aviso' : 'Info'}
      </Badge>
    );
  };

  const pieData = [
    { name: 'Crítico', value: stats.critical, color: SEVERITY_COLORS.critical },
    { name: 'Aviso', value: stats.warning, color: SEVERITY_COLORS.warning },
    { name: 'Info', value: stats.info, color: SEVERITY_COLORS.info },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Alertas</h1>
          <p className="text-muted-foreground mt-1">Visualize e analise alertas passados</p>
        </div>
        <Button onClick={fetchAlerts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Alertas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avisos</p>
                <p className="text-2xl font-bold text-warning">{stats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Informativos</p>
                <p className="text-2xl font-bold text-primary">{stats.info}</p>
              </div>
              <Info className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Leitura</p>
                <p className="text-2xl font-bold">{stats.readRate.toFixed(0)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Alertas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} name="Crítico" />
                <Bar dataKey="warning" stackId="a" fill={SEVERITY_COLORS.warning} name="Aviso" />
                <Bar dataKey="info" stackId="a" fill={SEVERITY_COLORS.info} name="Info" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição por Severidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alertas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {alertTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[250px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Lista de Alertas ({filteredAlerts.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Info className="h-8 w-8 mb-2" />
                <p>Nenhum alerta encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      alert.is_read ? 'bg-muted/30' : 'bg-card'
                    }`}
                  >
                    <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{alert.title}</span>
                        {getSeverityBadge(alert.severity)}
                        <Badge variant="outline" className="text-xs">
                          {alert.alert_type}
                        </Badge>
                        {alert.is_read && (
                          <CheckCircle className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertHistory;
