import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
 import { Wrench, Play, Loader2, ShieldAlert, Timer, BarChart3, Database, Trash2, Mail } from 'lucide-react';
 import { SystemLogs } from './SystemLogs';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const BACKGROUND_FUNCTIONS = [
  { name: 'check-alerts', label: 'Verificar Alertas de Metas', description: 'Verifica desvios das metas do dashboard', icon: ShieldAlert },
  { name: 'check-hold-alerts', label: 'Verificar Alertas de Espera', description: 'Detecta chamadas em espera acima do limite', icon: Timer },
  { name: 'check-queue-metrics', label: 'Verificar Métricas de Fila', description: 'Analisa métricas das filas de atendimento', icon: BarChart3 },
  { name: 'database-backup', label: 'Backup do Banco', description: 'Executa backup dos dados críticos', icon: Database },
  { name: 'database-cleanup', label: 'Limpeza do Banco', description: 'Remove registros expirados e temporários', icon: Trash2 },
  { name: 'process-digest', label: 'Processar Digest', description: 'Gera e envia resumo por e-mail aos usuários', icon: Mail },
];

export function SystemMaintenancePanel() {
  const [runningFn, setRunningFn] = useState<string | null>(null);

   const runFunction = useMutation({
     mutationFn: async (fnName: string) => {
       setRunningFn(fnName);
       const { data, error } = await supabase.functions.invoke(fnName);
       if (error) throw error;
       
       // Log the maintenance action via secure RPC
       await supabase.rpc('log_audit_event', {
         p_action: `Manual Execution: ${fnName}`,
         p_resource_type: 'system_maintenance',
         p_details: data || {}
       });
       
       return data;
     },
     onSuccess: (data, fnName) => {
       setRunningFn(null);
       toast.success(`${fnName} executado com sucesso`, { description: JSON.stringify(data).slice(0, 100) });
     },
    onError: (err, fnName) => {
      setRunningFn(null);
      toast.error(`Erro ao executar ${fnName}`, { description: String(err) });
    },
  });

   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Manutenção do Sistema</CardTitle>
        <CardDescription>Execute funções administrativas de background manualmente. Estas funções normalmente rodam de forma automática.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {BACKGROUND_FUNCTIONS.map(fn => {
          const Icon = fn.icon;
          const isRunning = runningFn === fn.name;
          return (
            <div key={fn.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{fn.label}</p>
                  <p className="text-xs text-muted-foreground">{fn.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runFunction.mutate(fn.name)}
                disabled={isRunning}
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Executar
              </Button>
            </div>
          );
        })}
       </CardContent>
       </Card>
       <SystemLogs />
     </div>
   );
}
