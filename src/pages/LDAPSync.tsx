import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FolderSync, Clock, Users, RefreshCw, Play, Settings2, Database, Save } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLDAPSync } from '@/hooks/useLDAPSync';
import { LDAPConfigTab } from '@/components/admin/ldap/LDAPConfigTab';
import { LDAPMappingTab } from '@/components/admin/ldap/LDAPMappingTab';
import { LDAPLogsTab } from '@/components/admin/ldap/LDAPLogsTab';

export default function LDAPSync() {
  usePageTitle('LDAP Sync');
  const {
    config, setConfig, logs, loading, saving, testing, syncing, lastResult,
    save, testConnection, runSync,
  } = useLDAPSync();

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
          <Button
            variant="outline"
            onClick={() => void save()}
            disabled={saving || loading}
            className="gap-2"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
          <Button onClick={() => void runSync()} disabled={syncing || loading} className="gap-2">
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
                <p className="text-sm font-medium">Consultando diretório e aplicando contatos...</p>
                <Progress value={undefined} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lastResult && !syncing && (
        <Card>
          <CardContent className="p-4 text-sm">
            {lastResult.ok ? (
              <p>
                Última execução: <strong>{lastResult.synced ?? 0}</strong> contato(s) —
                {' '}{lastResult.created ?? 0} criado(s), {lastResult.updated ?? 0} atualizado(s)
                {lastResult.failed ? `, ${lastResult.failed} falha(s)` : ''}
                {' '}em {((lastResult.durationMs ?? 0) / 1000).toFixed(1)}s.
              </p>
            ) : (
              <p className="text-destructive">Última execução falhou: {lastResult.error}</p>
            )}
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
          <LDAPConfigTab
            config={config}
            setConfig={setConfig}
            testing={testing}
            loading={loading}
            saving={saving}
            onTest={() => void testConnection()}
            onSave={() => void save()}
          />
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
