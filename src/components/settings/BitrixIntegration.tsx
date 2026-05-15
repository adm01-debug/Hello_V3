  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Button } from '@/components/ui/button';
  import { Label } from '@/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { 
    CheckCircle2, 
    AlertCircle, 
    ExternalLink, 
    User, 
    Phone, 
    Link as LinkIcon,
    RefreshCw
  } from 'lucide-react';
  import { useBitrix } from '@/hooks/useBitrix';
  import { useEffect, useState } from 'react';
  import { supabase } from '@/integrations/supabase/client';
  import { toast } from 'sonner';
 
  export function BitrixIntegration() {
    const { isConfigured, isLoading, checkConfiguration, syncAgents, syncDepartments } = useBitrix();
    const [logDestination, setLogDestination] = useState<'crm_timeline' | 'call_list'>('crm_timeline');
    const [saving, setSaving] = useState(false);
  
    useEffect(() => {
      checkConfiguration();
      loadSettings();
    }, [checkConfiguration]);

    const loadSettings = async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'bitrix_config').single();
      if (data?.value && typeof data.value === 'object' && 'log_destination' in data.value) {
        setLogDestination((data.value as any).log_destination);
      }
    };

    const saveSettings = async (val: string) => {
      setSaving(true);
      const { error } = await supabase.from('system_settings').upsert({
        key: 'bitrix_config',
        value: { log_destination: val, sync_enabled: true }
      });
      if (!error) {
        setLogDestination(val as any);
        toast.success('Configuração de log atualizada');
      }
      setSaving(false);
    };
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <img 
                 src="https://www.bitrix24.com.br/images/b24/menu-icon.svg" 
                 alt="Bitrix24" 
                 className="h-6 w-6"
               />
               Bitrix24
               {isConfigured === true && (
                 <Badge variant="default" className="bg-success/10 text-success border-success/20">
                   <CheckCircle2 className="h-3 w-3 mr-1" />
                   Conectado
                 </Badge>
               )}
               {isConfigured === false && (
                 <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                   <AlertCircle className="h-3 w-3 mr-1" />
                   Não configurado
                 </Badge>
               )}
             </CardTitle>
             <CardDescription>
               CRM, Telefonia e Webhooks do Bitrix24
             </CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="rounded-lg border border-muted bg-muted/30 p-4">
           <p className="text-sm text-muted-foreground mb-3">
             Para conectar ao Bitrix24, você precisa configurar a <strong>URL do Webhook</strong> nas configurações do backend.
           </p>
           <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
             <li>Acesse seu Bitrix24 → Aplicativos → Webhooks</li>
             <li>Crie um webhook de entrada com as permissões: CRM, Telefonia</li>
             <li>Copie a URL do webhook (ex: https://seudominio.bitrix24.com.br/rest/1/abc123/)</li>
             <li>Configure a secret BITRIX_WEBHOOK_URL no backend</li>
           </ol>
         </div>
 
         <div className="grid gap-4 md:grid-cols-3">
           <div className="p-4 rounded-lg border">
             <h4 className="font-medium flex items-center gap-2 mb-2">
               <User className="h-4 w-4 text-primary" />
               CRM
             </h4>
             <p className="text-xs text-muted-foreground">
               Contatos, Leads e Negócios sincronizados automaticamente
             </p>
           </div>
           <div className="p-4 rounded-lg border">
             <h4 className="font-medium flex items-center gap-2 mb-2">
               <Phone className="h-4 w-4 text-primary" />
               Telefonia
             </h4>
             <p className="text-xs text-muted-foreground">
               Chamadas registradas automaticamente no histórico
             </p>
           </div>
           <div className="p-4 rounded-lg border">
             <h4 className="font-medium flex items-center gap-2 mb-2">
               <LinkIcon className="h-4 w-4 text-primary" />
               Webhooks
             </h4>
             <p className="text-xs text-muted-foreground">
               Eventos em tempo real entre os sistemas
             </p>
           </div>
         </div>
 
          <div className="space-y-2 py-2 border-t border-b my-4">
            <Label>Destino dos Logs de Chamada</Label>
            <Select value={logDestination} onValueChange={saveSettings} disabled={saving}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crm_timeline">Timeline do CRM (Leads/Contatos)</SelectItem>
                <SelectItem value="call_list">Lista de Chamadas (Telefonia)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground italic">
              Define onde os eventos de auditoria e logs de chamadas serão exibidos no Bitrix24.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => window.open('https://www.bitrix24.com.br/apps/webhooks.php', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Bitrix24 Webhooks
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              disabled={isLoading}
              onClick={() => checkConfiguration()}
            >
              {isLoading ? 'Verificando...' : 'Testar Conexão'}
            </Button>
            <Button
              variant="premium"
              className="gap-2"
              disabled={isLoading || !isConfigured}
              onClick={() => {
                syncAgents();
                syncDepartments();
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar Agentes e Filas
            </Button>
          </div>
       </CardContent>
     </Card>
   );
 }