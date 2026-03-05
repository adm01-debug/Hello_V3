
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, RefreshCw, ShieldX, Globe, MapPin, TrendingUp, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

interface BlockedLog {
  id: string;
  ip_address: string;
  reason: string;
  user_email: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  country_code: string | null;
  created_at: string;
}

interface DailyStats {
  date: string;
  count: number;
}

interface ReasonStats {
  reason: string;
  count: number;
}

interface CountryStats {
  country: string;
  count: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const BlockedAccessLogs = () => {
  const [logs, setLogs] = useState<BlockedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("7");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [reasonStats, setReasonStats] = useState<ReasonStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);

  // Get unique countries and reasons for filter options
  const uniqueCountriesList = Array.from(new Set(logs.map(l => l.country).filter(Boolean))) as string[];
  const uniqueReasonsList = Array.from(new Set(logs.map(l => l.reason).filter(Boolean))) as string[];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), parseInt(dateRange));
      
      const { data, error } = await supabase
        .from("blocked_access_logs")
        .select("*")
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endOfDay(new Date()).toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setLogs(data || []);
      processStats(data || [], startDate);
    } catch (error) {
      console.error("Error fetching blocked logs:", error);
      toast.error("Erro ao carregar histórico de bloqueios");
    } finally {
      setLoading(false);
    }
  };

  const processStats = (data: BlockedLog[], startDate: Date) => {
    // Daily stats
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    const dailyMap = new Map<string, number>();
    days.forEach(day => {
      dailyMap.set(format(day, "yyyy-MM-dd"), 0);
    });
    
    data.forEach(log => {
      const dateKey = format(parseISO(log.created_at), "yyyy-MM-dd");
      if (dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
      }
    });

    const dailyData = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date: format(parseISO(date), "dd/MM", { locale: ptBR }),
      count
    }));
    setDailyStats(dailyData);

    // Reason stats
    const reasonMap = new Map<string, number>();
    data.forEach(log => {
      const reason = log.reason || "Desconhecido";
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });
    const reasonData = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
    setReasonStats(reasonData);

    // Country stats
    const countryMap = new Map<string, number>();
    data.forEach(log => {
      const country = log.country || "Desconhecido";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const countryData = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setCountryStats(countryData);
  };

  useEffect(() => {
    fetchLogs();
  }, [dateRange]);

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      log.ip_address?.toLowerCase().includes(searchLower) ||
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.reason?.toLowerCase().includes(searchLower) ||
      log.country?.toLowerCase().includes(searchLower) ||
      log.city?.toLowerCase().includes(searchLower)
    );
    const matchesCountry = countryFilter === "all" || log.country === countryFilter;
    const matchesReason = reasonFilter === "all" || log.reason === reasonFilter;
    return matchesSearch && matchesCountry && matchesReason;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setCountryFilter("all");
    setReasonFilter("all");
  };

  const hasActiveFilters = searchTerm || countryFilter !== "all" || reasonFilter !== "all";

  const totalBlocks = logs.length;
  const uniqueIPs = new Set(logs.map(l => l.ip_address)).size;
  const uniqueCountries = new Set(logs.map(l => l.country).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldX className="h-8 w-8 text-destructive" />
            Histórico de Bloqueios
          </h1>
          <p className="text-muted-foreground">
            Registro de tentativas de acesso bloqueadas por IP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Bloqueios</CardTitle>
            <ShieldX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBlocks}</div>
            <p className="text-xs text-muted-foreground">
              nos últimos {dateRange} dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Únicos</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueIPs}</div>
            <p className="text-xs text-muted-foreground">
              endereços diferentes bloqueados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Países</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCountries}</div>
            <p className="text-xs text-muted-foreground">
              países de origem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Bloqueios por Dia
            </CardTitle>
            <CardDescription>
              Tendência de bloqueios no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Bloqueios"
                    fill="hsl(var(--destructive))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Países
            </CardTitle>
            <CardDescription>
              Países com mais tentativas bloqueadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ country, percent }) => `${country} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="country"
                  >
                    {countryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tendência Acumulada</CardTitle>
            <CardDescription>
              Evolução dos bloqueios ao longo do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Bloqueios"
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivos */}
      {reasonStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Motivos de Bloqueio</CardTitle>
            <CardDescription>
              Distribuição por tipo de bloqueio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {reasonStats.map((stat, index) => (
                <Badge 
                  key={stat.reason} 
                  variant="outline"
                  className="text-sm py-1 px-3"
                  style={{ borderColor: COLORS[index % COLORS.length] }}
                >
                  {stat.reason}: {stat.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Detalhados</CardTitle>
          <CardDescription>
            Histórico completo de tentativas bloqueadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por IP, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os países</SelectItem>
                  {uniqueCountriesList.sort().map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os motivos</SelectItem>
                  {uniqueReasonsList.sort().map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>
                  Mostrando {filteredLogs.length} de {logs.length} registros
                  {countryFilter !== "all" && <Badge variant="secondary" className="ml-2">{countryFilter}</Badge>}
                  {reasonFilter !== "all" && <Badge variant="secondary" className="ml-2">{reasonFilter}</Badge>}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {log.user_email || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address}
                      </TableCell>
                      <TableCell>
                        {log.city && log.country ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {log.city}, {log.country}
                            {log.country_code && (
                              <span className="text-xs text-muted-foreground">
                                ({log.country_code})
                              </span>
                            )}
                          </span>
                        ) : log.country ? (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {log.country}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-xs">
                          {log.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.user_agent || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredLogs.length > 50 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Mostrando 50 de {filteredLogs.length} registros
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockedAccessLogs;
