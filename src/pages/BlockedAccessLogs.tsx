import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, ShieldX, Globe, MapPin, TrendingUp, Filter, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { usePageTitle } from '@/hooks/usePageTitle';
import { useBlockedAccessLogs } from '@/hooks/useBlockedAccessLogs';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const BlockedAccessLogs = () => {
  usePageTitle('Acessos Bloqueados');

  const {
    loading, filteredLogs, searchTerm, setSearchTerm,
    dateRange, setDateRange, countryFilter, setCountryFilter,
    reasonFilter, setReasonFilter, dailyStats, countryStats, reasonStats,
    uniqueCountriesList, uniqueReasonsList,
    clearFilters, hasActiveFilters, totalBlocks, uniqueIPs, uniqueCountries,
    fetchLogs, logs,
  } = useBlockedAccessLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldX className="h-8 w-8 text-destructive" />Histórico de Bloqueios
          </h1>
          <p className="text-muted-foreground">Registro de tentativas de acesso bloqueadas por IP</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Período" /></SelectTrigger>
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Bloqueios</CardTitle><ShieldX className="h-4 w-4 text-destructive" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalBlocks}</div><p className="text-xs text-muted-foreground">nos últimos {dateRange} dias</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">IPs Únicos</CardTitle><Globe className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{uniqueIPs}</div><p className="text-xs text-muted-foreground">endereços diferentes bloqueados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Países</CardTitle><MapPin className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{uniqueCountries}</div><p className="text-xs text-muted-foreground">países de origem</p></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Bloqueios por Dia</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Bloqueios" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Top Países</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={countryStats} cx="50%" cy="50%" labelLine={false} label={({ country, percent }: { country?: string; percent?: number }) => `${country} (${((percent ?? 0) * 100).toFixed(0)}%)`} outerRadius={100} dataKey="count" nameKey="country">
                    {countryStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader><CardTitle>Registros Detalhados</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por IP, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px]"><Globe className="h-4 w-4 mr-2" /><SelectValue placeholder="País" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os países</SelectItem>
                {uniqueCountriesList.sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[200px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Motivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os motivos</SelectItem>
                {uniqueReasonsList.sort().map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1"><X className="h-4 w-4" />Limpar</Button>}
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Filter className="h-4 w-4" />
              <span>Mostrando {filteredLogs.length} de {logs.length} registros</span>
            </div>
          )}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead><TableHead>IP</TableHead><TableHead>País</TableHead><TableHead>Motivo</TableHead><TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
                ) : filteredLogs.slice(0, 50).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                    <TableCell>{log.country ? <Badge variant="outline">{log.country}{log.city ? `, ${log.city}` : ''}</Badge> : '-'}</TableCell>
                    <TableCell><Badge variant="secondary">{log.reason}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{log.user_email || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockedAccessLogs;
