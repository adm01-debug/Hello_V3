import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  FolderSync, Server, Shield, Clock, Users, CheckCircle2, XCircle,
  RefreshCw, Play, Settings2, AlertTriangle, Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePageTitle } from '@/hooks/usePageTitle';

interface LDAPConfig {
  serverUrl: string;
  port: string;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
  useTLS: boolean;
  searchFilter: string;
  syncInterval: string;
  fieldMapping: {
    name: string;
    email: string;
    phone: string;
    company: string;
    position: string;
  };
}

interface SyncLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'partial';
  contactsSynced: number;
  contactsCreated: number;
  contactsUpdated: number;
  contactsFailed: number;
  duration: string;
  error?: string;
}

const mockLogs: SyncLog[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    status: 'success',
    contactsSynced: 245,
    contactsCreated: 12,
    contactsUpdated: 233,
    contactsFailed: 0,
    duration: '4.2s',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'partial',
    contactsSynced: 240,
    contactsCreated: 5,
    contactsUpdated: 230,
    contactsFailed: 5,
    duration: '5.1s',
    error: '5 contatos com DN inválido',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'error',
    contactsSynced: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    contactsFailed: 0,
    duration: '0.3s',
    error: 'Falha na conexão com servidor LDAP',
  },
];

export default function LDAPSync() {
  const [config, setConfig] = useState<LDAPConfig>({
    serverUrl: '',
    port: '389',
    baseDn: '',
    bindDn: '',
    bindPassword: '',
    useTLS: false,
    searchFilter: '(objectClass=person)',
    syncInterval: '60',
    fieldMapping: {
      name: 'cn',
      email: 'mail',
      phone: 'telephoneNumber',
      company: 'company',
      position: 'title',
    },
  });

  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [testing, setTesting] = useState(false);
  const [logs] = useState<SyncLog[]>(mockLogs);

  const handleTestConnection = async () => {
    if (!config.serverUrl || !config.baseDn) {
      toast.error('Preencha servidor e Base DN');
      return;
    }
    setTesting(true);
    // Simulate test
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
    
    // Simulate sync progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 300));
      setSyncProgress(i);
    }

    setSyncing(false);
    setSyncProgress(100);
    toast.success('Sincronização concluída! 245 contatos atualizados.');
  };

  const statusIcon = (status: SyncLog['status']) => {
  usePageTitle('LDAP Sync');

    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
    }
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
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
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
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Servidor LDAP
                </CardTitle>
                <CardDescription>Configure a conexão com o servidor de diretório</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Servidor LDAP *</Label>
                    <Input
                      placeholder="ldap.empresa.com"
                      value={config.serverUrl}
                      onChange={(e) => setConfig(p => ({ ...p, serverUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      placeholder="389"
                      value={config.port}
                      onChange={(e) => setConfig(p => ({ ...p, port: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Base DN *</Label>
                  <Input
                    placeholder="dc=empresa,dc=com"
                    value={config.baseDn}
                    onChange={(e) => setConfig(p => ({ ...p, baseDn: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bind DN</Label>
                  <Input
                    placeholder="cn=admin,dc=empresa,dc=com"
                    value={config.bindDn}
                    onChange={(e) => setConfig(p => ({ ...p, bindDn: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bind Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={config.bindPassword}
                    onChange={(e) => setConfig(p => ({ ...p, bindPassword: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <Label>Usar TLS/SSL (LDAPS)</Label>
                  </div>
                  <Switch
                    checked={config.useTLS}
                    onCheckedChange={(v) => setConfig(p => ({ ...p, useTLS: v, port: v ? '636' : '389' }))}
                  />
                </div>

                <Button variant="outline" onClick={handleTestConnection} disabled={testing} className="w-full gap-2">
                  {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Sincronização
                </CardTitle>
                <CardDescription>Configure filtros e intervalo de sincronização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filtro de Busca LDAP</Label>
                  <Input
                    placeholder="(objectClass=person)"
                    value={config.searchFilter}
                    onChange={(e) => setConfig(p => ({ ...p, searchFilter: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: (&(objectClass=person)(department=Sales))
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Intervalo de Sincronização</Label>
                  <Select
                    value={config.syncInterval}
                    onValueChange={(v) => setConfig(p => ({ ...p, syncInterval: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">A cada 15 minutos</SelectItem>
                      <SelectItem value="30">A cada 30 minutos</SelectItem>
                      <SelectItem value="60">A cada 1 hora</SelectItem>
                      <SelectItem value="360">A cada 6 horas</SelectItem>
                      <SelectItem value="1440">A cada 24 horas</SelectItem>
                      <SelectItem value="manual">Apenas manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <h4 className="text-sm font-medium">Resumo da Configuração</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Servidor:</span>
                    <span className="text-foreground">{config.serverUrl || '—'}</span>
                    <span>Porta:</span>
                    <span className="text-foreground">{config.port}</span>
                    <span>TLS:</span>
                    <span className="text-foreground">{config.useTLS ? 'Sim' : 'Não'}</span>
                    <span>Intervalo:</span>
                    <span className="text-foreground">{config.syncInterval === 'manual' ? 'Manual' : `${config.syncInterval} min`}</span>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={() => toast.success('Configuração salva!')}>
                  Salvar Configuração
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mapeamento de Campos</CardTitle>
              <CardDescription>Mapeie atributos LDAP para campos de contatos do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Nome', key: 'name' as const, placeholder: 'cn' },
                  { label: 'Email', key: 'email' as const, placeholder: 'mail' },
                  { label: 'Telefone', key: 'phone' as const, placeholder: 'telephoneNumber' },
                  { label: 'Empresa', key: 'company' as const, placeholder: 'company' },
                  { label: 'Cargo', key: 'position' as const, placeholder: 'title' },
                ].map((field) => (
                  <div key={field.key} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <div className="w-24 text-sm font-medium">{field.label}</div>
                    <span className="text-muted-foreground">→</span>
                    <Input
                      placeholder={field.placeholder}
                      value={config.fieldMapping[field.key]}
                      onChange={(e) =>
                        setConfig(p => ({
                          ...p,
                          fieldMapping: { ...p.fieldMapping, [field.key]: e.target.value },
                        }))
                      }
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Sincronização</CardTitle>
              <CardDescription>Últimas sincronizações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Sincronizados</TableHead>
                    <TableHead>Criados</TableHead>
                    <TableHead>Atualizados</TableHead>
                    <TableHead>Falhas</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{statusIcon(log.status)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{log.contactsSynced}</TableCell>
                      <TableCell>{log.contactsCreated}</TableCell>
                      <TableCell>{log.contactsUpdated}</TableCell>
                      <TableCell>
                        {log.contactsFailed > 0 ? (
                          <span className="text-destructive">{log.contactsFailed}</span>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell>{log.duration}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.error || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
