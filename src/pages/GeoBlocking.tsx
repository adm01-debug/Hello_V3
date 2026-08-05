import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Globe, Shield, Plus, Trash2, MapPin, AlertTriangle, Check, Search, Loader2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGeoBlocking } from '@/hooks/useGeoBlocking';

import { safeToLocaleDateString, safeToLocaleString } from "@/lib/safe-date";
export default function GeoBlocking() {
  usePageTitle('Bloqueio Geográfico');

  const {
    settings, settingsLoading, restrictionsLoading,
    selectedCountry, setSelectedCountry, reason, setReason,
    testIp, setTestIp, testResult,
    allowedCountries, availableCountries, blockedLogs,
    updateSettings, addCountry, removeCountry, testGeoValidation,
  } = useGeoBlocking();

  if (settingsLoading || restrictionsLoading) {
    return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Bloqueio Geográfico</h1>
          <p className="text-muted-foreground">Whitelist global - Apenas países permitidos podem acessar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Configurações</CardTitle>
          <CardDescription>Habilite o bloqueio geográfico para restringir o acesso ao sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5"><Label htmlFor="geo-enabled">Bloqueio Geográfico Ativo</Label><p className="text-sm text-muted-foreground">Quando ativo, apenas países na whitelist podem acessar</p></div>
            <Switch id="geo-enabled" checked={settings?.enabled ?? false} onCheckedChange={(checked) => updateSettings.mutate({ enabled: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5"><Label htmlFor="log-blocked">Registrar Tentativas Bloqueadas</Label><p className="text-sm text-muted-foreground">Mantém log de todas as tentativas de acesso bloqueadas</p></div>
            <Switch id="log-blocked" checked={settings?.log_blocked_attempts ?? true} onCheckedChange={(checked) => updateSettings.mutate({ log_blocked_attempts: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5"><Label htmlFor="notify-block">Notificar ao Bloquear</Label><p className="text-sm text-muted-foreground">Envia alerta quando um acesso é bloqueado</p></div>
            <Switch id="notify-block" checked={settings?.notify_on_block ?? false} onCheckedChange={(checked) => updateSettings.mutate({ notify_on_block: checked })} />
          </div>
          {settings?.enabled && (
            <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2"><Check className="h-5 w-5 text-primary" /><span className="text-sm font-medium">Modo Whitelist: {allowedCountries.length} países permitidos</span></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Adicionar País à Whitelist</CardTitle><CardDescription>Países na whitelist terão acesso permitido ao sistema</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]"><Label>País</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}><SelectTrigger><SelectValue placeholder="Selecione um país" /></SelectTrigger><SelectContent>{availableCountries.map(c => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="flex-1 min-w-[200px]"><Label>Motivo (opcional)</Label><Input placeholder="Ex: Escritório principal" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={() => addCountry.mutate()} disabled={!selectedCountry || addCountry.isPending}><Plus className="h-4 w-4 mr-2" />Adicionar</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Países Permitidos ({allowedCountries.length})</CardTitle><CardDescription>Apenas usuários destes países podem acessar o sistema</CardDescription></CardHeader>
        <CardContent>
          {allowedCountries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Globe className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Nenhum país na whitelist</p><p className="text-sm">Adicione países acima para permitir acesso</p></div>
          ) : (
            <Table><TableHeader><TableRow><TableHead>País</TableHead><TableHead>Código</TableHead><TableHead>Motivo</TableHead><TableHead>Adicionado em</TableHead><TableHead className="w-[80px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>{allowedCountries.map(c => (
                <TableRow key={c.id}><TableCell className="font-medium">{c.country_name}</TableCell><TableCell><Badge variant="secondary">{c.country_code}</Badge></TableCell><TableCell className="text-muted-foreground">{c.reason || '-'}</TableCell><TableCell className="text-muted-foreground">{safeToLocaleDateString(c.created_at, 'pt-BR')}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => removeCountry.mutate(c.id)} disabled={removeCountry.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>
              ))}</TableBody></Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Testar Validação de IP</CardTitle><CardDescription>Verifique se um endereço IP seria permitido ou bloqueado pelas regras atuais</CardDescription></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Ex: 203.0.113.1" value={testIp} onChange={e => setTestIp(e.target.value)} className="max-w-xs font-mono" />
            <Button onClick={() => testGeoValidation.mutate(testIp)} disabled={!testIp || testGeoValidation.isPending}>
              {testGeoValidation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}Testar
            </Button>
          </div>
          {testResult && (
            <div className="mt-4 p-3 rounded-lg border bg-muted/30 text-sm space-y-1">
              <p><strong>IP:</strong> <span className="font-mono">{String(testResult.ip_address ?? testIp)}</span></p>
              <p><strong>País:</strong> {String(testResult.country_name ?? 'Desconhecido')} ({String(testResult.country_code ?? '?')})</p>
              <p><strong>Resultado:</strong>{' '}{testResult.allowed ? <Badge className="bg-emerald-500/15 text-emerald-600 gap-1"><Check className="h-3 w-3" />Permitido</Badge> : <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Bloqueado</Badge>}</p>
              {testResult.reason ? <p><strong>Motivo:</strong> {String(testResult.reason)}</p> : null}
            </div>
          )}
        </CardContent>
      </Card>

      {blockedLogs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Acessos Bloqueados Recentes</CardTitle><CardDescription>Últimas tentativas de acesso de países não permitidos</CardDescription></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>País</TableHead><TableHead>IP</TableHead><TableHead>Usuário</TableHead><TableHead>Motivo</TableHead></TableRow></TableHeader>
              <TableBody>{blockedLogs.slice(0, 10).map(log => (
                <TableRow key={log.id}><TableCell className="text-muted-foreground">{safeToLocaleString(log.created_at, 'pt-BR')}</TableCell><TableCell><Badge variant="destructive">{log.country_name || log.country_code || 'Desconhecido'}</Badge></TableCell><TableCell className="font-mono text-sm">{log.ip_address}</TableCell><TableCell>{log.user_email || '-'}</TableCell><TableCell className="text-muted-foreground">{log.reason || 'País não permitido'}</TableCell></TableRow>
              ))}</TableBody></Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
