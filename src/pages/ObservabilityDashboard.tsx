import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoipInfrastructureTab } from '@/components/executive/VoipInfrastructureTab';
import { RealtimeQualityDashboard } from '@/components/executive/RealtimeQualityDashboard';
import { useWebVitals } from '@/hooks/useWebVitals';
import { SystemIntegrityDashboard } from '@/components/dashboard/SystemIntegrityDashboard';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { getErrorReports } from '@/lib/error-tracking';
import {
  Activity, Heart, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Gauge, Clock, Monitor, Zap, Loader2, FileDown,
  ShieldCheck, Database, Lock, Search, PlayCircle, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const vitalConfig: Record<string, { label: string; unit: string; icon: React.ReactNode }> = {
  LCP: { label: 'Largest Contentful Paint', unit: 'ms', icon: <Monitor className="h-4 w-4" /> },
  FID: { label: 'First Input Delay', unit: 'ms', icon: <Zap className="h-4 w-4" /> },
  CLS: { label: 'Cumulative Layout Shift', unit: '', icon: <Activity className="h-4 w-4" /> },
  FCP: { label: 'First Contentful Paint', unit: 'ms', icon: <Gauge className="h-4 w-4" /> },
  TTFB: { label: 'Time to First Byte', unit: 'ms', icon: <Clock className="h-4 w-4" /> },
  INP: { label: 'Interaction to Next Paint', unit: 'ms', icon: <Zap className="h-4 w-4" /> },
};

const ratingColors: Record<string, string> = {
  good: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  'needs-improvement': 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  poor: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  healthy: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  degraded: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  down: <XCircle className="h-5 w-5 text-destructive" />,
  checking: <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />,
};

export default function ObservabilityDashboard() {
  usePageTitle('Observabilidade');

  const { vitals, history, refresh: refreshVitals } = useWebVitals();
  const { services, overallStatus, isChecking, runChecks } = useHealthCheck();
  const errors = getErrorReports();
  const [rlsStatus, setRlsStatus] = useState<{ table_name: string; rls_enabled: boolean }[]>([]);
  const [loadingRls, setLoadingRls] = useState(false);
  const [rlsSearch, setRlsSearch] = useState('');
  const [loadTestResult, setLoadTestResult] = useState<any>(null);
  const [isRunningLoadTest, setIsRunningLoadTest] = useState(false);

  const runLoadTest = async () => {
    setIsRunningLoadTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('voip-load-test');
      if (error) throw error;
      setLoadTestResult(data.stats);
      toast.success('Teste de carga concluído com sucesso!');
    } catch (err) {
      console.error('Error running load test:', err);
      toast.error('Erro ao executar teste de carga');
    } finally {
      setIsRunningLoadTest(false);
    }
  };

  const fetchRlsStatus = async () => {
    setLoadingRls(true);
    try {
      const { data, error } = await supabase.rpc('check_all_tables_rls_status');
      if (error) {
        toast.error('Algumas verificações de RLS requerem privilégios elevados.');
      } else {
        setRlsStatus((data as any[]) || []);
      }
    } catch (err) {
      console.error('Error fetching RLS status:', err);
    } finally {
      setLoadingRls(false);
    }
  };

  useEffect(() => {
    runChecks();
    fetchRlsStatus();
  }, [runChecks]);

  const filteredRls = rlsStatus.filter(t => 
    t.table_name.toLowerCase().includes(rlsSearch.toLowerCase())
  );

  const vitalChartData = Object.entries(vitals)
    .filter(([, m]) => m)
    .map(([name, m]) => ({
      name,
      value: Math.round((m!.value + Number.EPSILON) * 100) / 100,
      rating: m!.rating,
    }));

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            Observabilidade
          </h1>
          <p className="text-muted-foreground mt-1">
            Web Vitals, health checks e monitoramento em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={
            overallStatus === 'healthy' ? 'border-green-500 text-green-600' :
            overallStatus === 'degraded' ? 'border-yellow-500 text-yellow-600' :
            'border-red-500 text-red-600'
          }>
            {statusIcons[overallStatus]}
            <span className="ml-1 capitalize">{overallStatus}</span>
          </Badge>
          <Button variant="outline" onClick={() => window.print()} className="hidden sm:flex">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Auditoria
          </Button>
          <Button variant="outline" onClick={() => { refreshVitals(); runChecks(); }} disabled={isChecking}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      <SystemIntegrityDashboard />

      <Tabs defaultValue="vitals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
            <TabsTrigger value="health">Health Checks</TabsTrigger>
            <TabsTrigger value="voip">Infraestrutura</TabsTrigger>
            <TabsTrigger value="quality">Qualidade (RT)</TabsTrigger>
            <TabsTrigger value="load-test">Teste de Carga</TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Segurança & RLS
          </TabsTrigger>
          <TabsTrigger value="errors">
            Erros
            {errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">{errors.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Web Vitals */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(vitalConfig).map(([key, config]) => {
              const metric = vitals[key];
              return (
                <Card key={key}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {config.icon}
                        {key}
                      </div>
                      {metric && (
                        <Badge variant="outline" className={ratingColors[metric.rating]}>
                          {metric.rating === 'good' ? 'Bom' : metric.rating === 'needs-improvement' ? 'Médio' : 'Ruim'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">
                      {metric ? `${Math.round(metric.value * 100) / 100}${config.unit}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {vitalChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vitalChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Health Checks */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusIcons[service.status]}
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.latency !== undefined ? `${service.latency}ms` : 'Verificando...'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      service.status === 'healthy' ? 'default' :
                      service.status === 'degraded' ? 'secondary' :
                      service.status === 'down' ? 'destructive' : 'outline'
                    }>
                      {service.status === 'healthy' ? 'OK' :
                       service.status === 'down' ? 'Offline' :
                       service.status === 'checking' ? '...' : 'Degradado'}
                    </Badge>
                  </div>
                  {service.error && (
                    <p className="text-xs text-destructive mt-2 truncate">{service.error}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Latência dos Serviços</CardTitle>
              <CardDescription>Tempo de resposta em milissegundos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={services.filter(s => s.latency !== undefined).map(s => ({ name: s.name, latency: s.latency }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="latency" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

         {/* VoIP Infrastructure */}
         <TabsContent value="voip" className="space-y-4">
           <VoipInfrastructureTab />
         </TabsContent>

         {/* Real-time Quality */}
          <TabsContent value="quality" className="space-y-4">
            <RealtimeQualityDashboard />
          </TabsContent>
  
          {/* Load Test */}
          <TabsContent value="load-test" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Simulação de Carga VoIP</h3>
                <p className="text-sm text-muted-foreground">Valida latência e gargalos do banco de dados sob estresse</p>
              </div>
              <Button onClick={runLoadTest} disabled={isRunningLoadTest}>
                {isRunningLoadTest ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                Iniciar Teste Real
              </Button>
            </div>

            {loadTestResult && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Zap className="h-4 w-4" /> Latência Inserção
                    </div>
                    <p className="text-2xl font-bold">{loadTestResult.insert_latency_avg_ms.toFixed(2)}ms</p>
                    <Badge variant={loadTestResult.insert_latency_avg_ms < 50 ? "default" : "destructive"} className="mt-1">
                      {loadTestResult.insert_latency_avg_ms < 50 ? "Excelente" : "Degradado"}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Search className="h-4 w-4" /> Latência Query
                    </div>
                    <p className="text-2xl font-bold">{loadTestResult.select_latency_ms.toFixed(2)}ms</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" /> Duração Total
                    </div>
                    <p className="text-2xl font-bold">{loadTestResult.total_duration_ms.toFixed(2)}ms</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <BarChart3 className="h-4 w-4" /> Registros
                    </div>
                    <p className="text-2xl font-bold">{loadTestResult.records_processed}</p>
                    <p className="text-xs text-muted-foreground mt-1">Lote SIP Processado</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
 
         {/* Security & RLS */}
         <TabsContent value="security" className="space-y-4">
           <div className="grid gap-4 md:grid-cols-4">
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                   <Lock className="h-4 w-4" />
                   Tabelas Protegidas
                 </div>
                 <p className="text-2xl font-bold">
                   {rlsStatus.filter(t => t.rls_enabled).length} / {rlsStatus.length}
                 </p>
                 <Progress 
                   value={rlsStatus.length > 0 ? (rlsStatus.filter(t => t.rls_enabled).length / rlsStatus.length) * 100 : 0} 
                   className="mt-2 h-1" 
                 />
               </CardContent>
             </Card>
             <Card>
               <CardContent className="pt-6">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                   <Database className="h-4 w-4" />
                   Total de Tabelas
                 </div>
                 <p className="text-2xl font-bold">{rlsStatus.length || '—'}</p>
                 <p className="text-xs text-muted-foreground mt-1">Esquema Public</p>
               </CardContent>
             </Card>
           </div>

           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <div>
                 <CardTitle>Auditoria de Row Level Security (RLS)</CardTitle>
                 <CardDescription>Status de proteção de cada tabela no banco de dados</CardDescription>
               </div>
               <div className="relative w-64">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Filtrar tabelas..." 
                   className="pl-8" 
                   value={rlsSearch}
                   onChange={(e) => setRlsSearch(e.target.value)}
                 />
               </div>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Tabela</TableHead>
                     <TableHead>Status RLS</TableHead>
                     <TableHead>Risco</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredRls.map((row) => (
                     <TableRow key={row.table_name}>
                       <TableCell className="font-mono text-sm">{row.table_name}</TableCell>
                       <TableCell>
                         <Badge variant={row.rls_enabled ? "default" : "destructive"}>
                           {row.rls_enabled ? "Ativo" : "Desativado"}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         {row.rls_enabled ? (
                           <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Protegido</Badge>
                         ) : (
                           <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">ALTO RISCO</Badge>
                         )}
                       </TableCell>
                     </TableRow>
                   ))}
                   {rlsStatus.length === 0 && !loadingRls && (
                     <TableRow>
                       <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                         Execute 'Sincronizar' para carregar dados de auditoria detalhados.
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
         </TabsContent>

         {/* Errors */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erros Capturados</CardTitle>
              <CardDescription>Últimos {errors.length} erros em runtime</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 mb-2 text-green-500" />
                  <p>Nenhum erro capturado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errors.slice().reverse().map((err, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant={err.type === 'error' ? 'destructive' : 'secondary'}>
                            {err.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate font-mono text-sm">
                          {err.message}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {err.filename ? `${err.filename}:${err.lineno}` : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(err.timestamp).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
