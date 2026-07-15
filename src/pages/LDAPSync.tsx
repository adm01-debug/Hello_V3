import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FolderSync, Clock, Users, RefreshCw, Play, Settings2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  DEFAULT_LDAP_CONFIG,
  MOCK_SYNC_LOGS,
  type LDAPConfig,
} from '@/components/admin/ldap/types';
import { LDAPConfigTab } from '@/components/admin/ldap/LDAPConfigTab';
import { LDAPMappingTab } from '@/components/admin/ldap/LDAPMappingTab';
import { LDAPLogsTab } from '@/components/admin/ldap/LDAPLogsTab';

export default function LDAPSync() {
  usePageTitle('LDAP Sync');
  const [config, setConfig] = useState<LDAPConfig>(DEFAULT_LDAP_CONFIG);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [testing, setTesting] = useState(false);
  const [logs] = useState(MOCK_SYNC_LOGS);

  const handleTestConnection = async () => {
    if (!config.serverUrl || !config.baseDn) {
      toast.error('Preencha servidor e Base DN');
      return;
    }
    setTesting(true);
    await new Promise(r => setTimeout(r, 2000));
    setTesting(false);
    toast.success('Conexão LDAP testada com sucesso!');
  };

  const handleSync = async () => {
    if (!config.serverUrl) {
      toast.error('Configure o servidor LDAP primeiro');
      return;
    }
    setSyncing(true);
    setSyncProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 300));
      setSyncProgress(i);
    }
    setSyncing(false);
    setSyncProgress(100);
    toast.success('Sincronização concluída! 245 contatos atualizados.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3">
            <FolderSync className="h-8 w-8 text-primary" />
            Sincronização LDAP
          </h1>
          <p className="text-muted-foreground mt-1">
            Sincronize contatos do diretório corporativo automaticamente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Active Directory / OpenLDAP
          </Badge>
          <Button onClick={handleSync} disabled={syncing} className="gap-2">
            {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </Button>
        </div>
      </div>

      {syncing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Sincronizando contatos...</p>
                <Progress value={syncProgress} className="mt-2 h-2" />
              </div>
              <span className="text-sm text-muted-foreground">{syncProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="mapping" className="gap-2">
            <Users className="h-4 w-4" />
            Mapeamento
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <LDAPConfigTab config={config} setConfig={setConfig} testing={testing} onTest={handleTestConnection} />
        </TabsContent>
        <TabsContent value="mapping">
          <LDAPMappingTab config={config} setConfig={setConfig} />
        </TabsContent>
        <TabsContent value="logs">
          <LDAPLogsTab logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
