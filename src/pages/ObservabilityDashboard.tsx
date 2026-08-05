import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoipInfrastructureTab } from '@/components/executive/VoipInfrastructureTab';
import { RealtimeQualityDashboard } from '@/components/executive/RealtimeQualityDashboard';
import { useWebVitals } from '@/hooks/useWebVitals';
import { SystemIntegrityDashboard } from '@/components/dashboard/SystemIntegrityDashboard';
import { QualityTrunkDashboard } from '@/components/executive/QualityTrunkDashboard';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { getErrorReports } from '@/lib/error-tracking';
import { Heart, RefreshCw, FileDown, ShieldCheck } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { statusIcons, type LoadTestStats } from '@/components/observability/constants';
import { VitalsTab } from '@/components/observability/VitalsTab';
import { HealthTab } from '@/components/observability/HealthTab';
import { LoadTestTab } from '@/components/observability/LoadTestTab';
import { SecurityRlsTab } from '@/components/observability/SecurityRlsTab';
import { ErrorsTab } from '@/components/observability/ErrorsTab';

export default function ObservabilityDashboard() {
  usePageTitle('Observabilidade');

  const { vitals, refresh: refreshVitals } = useWebVitals();
  const { services, overallStatus, isChecking, runChecks } = useHealthCheck();
  const errors = getErrorReports();
  const [rlsStatus, setRlsStatus] = useState<{ table_name: string; rls_enabled: boolean }[]>([]);
  const [loadingRls, setLoadingRls] = useState(false);
  const [rlsSearch, setRlsSearch] = useState('');
  const [loadTestResult, setLoadTestResult] = useState<LoadTestStats | null>(null);
  const [isRunningLoadTest, setIsRunningLoadTest] = useState(false);

  const runLoadTest = useCallback(async () => {
    setIsRunningLoadTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('voip-load-test');
      if (error) throw error;
      setLoadTestResult((data as { stats: LoadTestStats }).stats);
      toast.success('Teste de carga concluído com sucesso!');
    } catch (err) {
      logger.error('Observability: load test failed', err);
      toast.error('Erro ao executar teste de carga');
    } finally {
      setIsRunningLoadTest(false);
    }
  }, []);

  const fetchRlsStatus = useCallback(async () => {
    setLoadingRls(true);
    try {
      const { data, error } = await supabase.rpc('check_all_tables_rls_status');
      if (error) {
        toast.error('Algumas verificações de RLS requerem privilégios elevados.');
      } else {
        setRlsStatus((data as { table_name: string; rls_enabled: boolean }[]) || []);
      }
    } catch (err) {
      logger.error('Observability: fetch RLS failed', err);
    } finally {
      setLoadingRls(false);
    }
  }, []);

  useEffect(() => {
    runChecks();
    fetchRlsStatus();
  }, [runChecks, fetchRlsStatus]);

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
            {errors.length > 0 && <Badge variant="destructive" className="ml-2">{errors.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals"><VitalsTab vitals={vitals} /></TabsContent>
        <TabsContent value="health"><HealthTab services={services} /></TabsContent>
        <TabsContent value="voip" className="space-y-4"><VoipInfrastructureTab /></TabsContent>
        <TabsContent value="quality" className="space-y-4">
          <QualityTrunkDashboard />
          <RealtimeQualityDashboard />
        </TabsContent>
        <TabsContent value="load-test">
          <LoadTestTab result={loadTestResult} isRunning={isRunningLoadTest} onRun={runLoadTest} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityRlsTab rlsStatus={rlsStatus} loading={loadingRls} search={rlsSearch} onSearchChange={setRlsSearch} />
        </TabsContent>
        <TabsContent value="errors"><ErrorsTab errors={errors} /></TabsContent>
      </Tabs>
    </div>
  );
}
