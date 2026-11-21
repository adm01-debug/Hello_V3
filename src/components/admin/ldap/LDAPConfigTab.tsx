import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Server, Shield, Settings2, RefreshCw, Save } from 'lucide-react';
import type { LDAPConfig } from './types';

interface Props {
  config: LDAPConfig;
  setConfig: React.Dispatch<React.SetStateAction<LDAPConfig>>;
  testing: boolean;
  loading: boolean;
  saving: boolean;
  onTest: () => void;
  onSave: () => void;
}

export function LDAPConfigTab({ config, setConfig, testing, loading, saving, onTest, onSave }: Props) {
  return (
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
                disabled={loading}
                onChange={(e) => setConfig(p => ({ ...p, serverUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Porta</Label>
              <Input
                placeholder="389"
                value={config.port}
                disabled={loading}
                onChange={(e) => setConfig(p => ({ ...p, port: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Base DN *</Label>
            <Input
              placeholder="dc=empresa,dc=com"
              value={config.baseDn}
              disabled={loading}
              onChange={(e) => setConfig(p => ({ ...p, baseDn: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Bind DN</Label>
            <Input
              placeholder="cn=admin,dc=empresa,dc=com"
              value={config.bindDn}
              disabled={loading}
              onChange={(e) => setConfig(p => ({ ...p, bindDn: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Bind Password</Label>
            <Input
              type="password"
              placeholder="•••••••• (deixe vazio para manter a atual)"
              value={config.bindPassword}
              disabled={loading}
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
              disabled={loading}
              onCheckedChange={(v) => setConfig(p => ({ ...p, useTLS: v, port: v ? '636' : '389' }))}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={onTest} disabled={testing || loading} className="gap-2">
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
            <Button onClick={onSave} disabled={saving || loading} className="gap-2">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
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
              disabled={loading}
              onChange={(e) => setConfig(p => ({ ...p, searchFilter: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Ex: (&amp;(objectClass=person)(department=Sales))
            </p>
          </div>

          <div className="space-y-2">
            <Label>Intervalo de Sincronização</Label>
            <Select
              value={config.syncInterval}
              onValueChange={(v) => setConfig(p => ({ ...p, syncInterval: v }))}
              disabled={loading}
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
            <p className="text-xs text-muted-foreground">
              O intervalo é a preferência salva. A sincronização automática requer um agendamento
              (pg_cron) chamando a ação <code>sync</code>.
            </p>
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
        </CardContent>
      </Card>
    </div>
  );
}
