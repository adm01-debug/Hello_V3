import { useEffect } from 'react';
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
  RefreshCw, Gauge, Clock, Monitor, Zap, Loader2, FileDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePageTitle } from '@/hooks/usePageTitle';

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

  useEffect(() => {
    runChecks();
  }, [runChecks]);

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
