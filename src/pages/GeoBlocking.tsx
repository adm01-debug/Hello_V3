import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Globe, Shield, Plus, Trash2, MapPin, AlertTriangle, Check, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Lista de países com códigos ISO
const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'IT', name: 'Itália' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'CA', name: 'Canadá' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'PE', name: 'Peru' },
  { code: 'JP', name: 'Japão' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'Índia' },
  { code: 'AU', name: 'Austrália' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'ZA', name: 'África do Sul' },
  { code: 'RU', name: 'Rússia' },
  { code: 'KR', name: 'Coreia do Sul' },
  { code: 'AE', name: 'Emirados Árabes' },
  { code: 'SA', name: 'Arábia Saudita' },
  { code: 'IL', name: 'Israel' },
  { code: 'SG', name: 'Singapura' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Tailândia' },
  { code: 'VN', name: 'Vietnã' },
  { code: 'PH', name: 'Filipinas' },
  { code: 'ID', name: 'Indonésia' },
  { code: 'MY', name: 'Malásia' },
  { code: 'NL', name: 'Holanda' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'CH', name: 'Suíça' },
  { code: 'AT', name: 'Áustria' },
  { code: 'PL', name: 'Polônia' },
  { code: 'SE', name: 'Suécia' },
  { code: 'NO', name: 'Noruega' },
  { code: 'DK', name: 'Dinamarca' },
  { code: 'FI', name: 'Finlândia' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'GR', name: 'Grécia' },
  { code: 'TR', name: 'Turquia' },
  { code: 'EG', name: 'Egito' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'KE', name: 'Quênia' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'EC', name: 'Equador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'PA', name: 'Panamá' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'NI', name: 'Nicarágua' },
  { code: 'SV', name: 'El Salvador' },
].sort((a, b) => a.name.localeCompare(b.name));

interface GeoSettings {
  id: string;
  enabled: boolean;
  mode: string;
  log_blocked_attempts: boolean;
  notify_on_block: boolean;
}

interface GeoRestriction {
  id: string;
  country_code: string;
  country_name: string;
  restriction_type: string;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

export default function GeoBlocking() {
  const queryClient = useQueryClient();
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [reason, setReason] = useState('');
  const [testIp, setTestIp] = useState('');
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['geo-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geo_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as GeoSettings | null;
    }
  });

  // Fetch restrictions
  const { data: restrictions = [], isLoading: restrictionsLoading } = useQuery({
    queryKey: ['geo-restrictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geo_restrictions')
        .select('*')
        .order('country_name', { ascending: true });
      
      if (error) throw error;
      return data as GeoRestriction[];
    }
  });

  // Fetch access logs
  const { data: accessLogs = [] } = useQuery({
    queryKey: ['geo-access-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geo_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // Initialize settings if not exists
  const initializeSettings = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('geo_settings')
        .insert({
          enabled: false,
          mode: 'allowlist',
          log_blocked_attempts: true,
          notify_on_block: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-settings'] });
    }
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<GeoSettings>) => {
      if (!settings?.id) return;
      
      const { error } = await supabase
        .from('geo_settings')
        .update(updates)
        .eq('id', settings.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-settings'] });
      toast.success('Configurações atualizadas');
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    }
  });

  // Add country
  const addCountry = useMutation({
    mutationFn: async () => {
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      if (!country) throw new Error('País não encontrado');

      const { error } = await supabase
        .from('geo_restrictions')
        .insert({
          country_code: country.code,
          country_name: country.name,
          restriction_type: 'allow',
          reason: reason || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-restrictions'] });
      setSelectedCountry('');
      setReason('');
      toast.success('País adicionado à whitelist');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este país já está na lista');
      } else {
        toast.error('Erro ao adicionar país');
      }
    }
  });

  // Remove country
  const removeCountry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('geo_restrictions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geo-restrictions'] });
      toast.success('País removido da whitelist');
    },
    onError: () => {
      toast.error('Erro ao remover país');
    }
  });

  const testGeoValidation = useMutation({
    mutationFn: async (ip: string) => {
      const { data, error } = await supabase.functions.invoke('validate-geo', {
        body: { ip_address: ip },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setTestResult(data as Record<string, unknown>);
      if (data?.allowed) {
        toast.success('IP permitido', { description: `País: ${data.country_name || 'Desconhecido'}` });
      } else {
        toast.error('IP bloqueado', { description: `País: ${data.country_name || 'Desconhecido'} — ${data.reason || 'Não autorizado'}` });
      }
    },
    onError: () => toast.error('Erro ao validar IP'),
  });

  // Initialize settings on first load
  useEffect(() => {
    if (!settingsLoading && !settings) {
      initializeSettings.mutate();
    }
  }, [settingsLoading, settings]);

  const allowedCountries = restrictions.filter(r => r.restriction_type === 'allow');
  const availableCountries = COUNTRIES.filter(
    c => !allowedCountries.some(r => r.country_code === c.code)
  );

  const blockedLogs = accessLogs.filter(log => log.action === 'blocked');

  if (settingsLoading || restrictionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Bloqueio Geográfico</h1>
          <p className="text-muted-foreground">
            Whitelist global - Apenas países permitidos podem acessar
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações
          </CardTitle>
          <CardDescription>
            Habilite o bloqueio geográfico para restringir o acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="geo-enabled">Bloqueio Geográfico Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Quando ativo, apenas países na whitelist podem acessar
              </p>
            </div>
            <Switch
              id="geo-enabled"
              checked={settings?.enabled ?? false}
              onCheckedChange={(checked) => updateSettings.mutate({ enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="log-blocked">Registrar Tentativas Bloqueadas</Label>
              <p className="text-sm text-muted-foreground">
                Mantém log de todas as tentativas de acesso bloqueadas
              </p>
            </div>
            <Switch
              id="log-blocked"
              checked={settings?.log_blocked_attempts ?? true}
              onCheckedChange={(checked) => updateSettings.mutate({ log_blocked_attempts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-block">Notificar ao Bloquear</Label>
              <p className="text-sm text-muted-foreground">
                Envia alerta quando um acesso é bloqueado
              </p>
            </div>
            <Switch
              id="notify-block"
              checked={settings?.notify_on_block ?? false}
              onCheckedChange={(checked) => updateSettings.mutate({ notify_on_block: checked })}
            />
          </div>

          {settings?.enabled && (
            <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Modo Whitelist: {allowedCountries.length} países permitidos
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Country */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar País à Whitelist
          </CardTitle>
          <CardDescription>
            Países na whitelist terão acesso permitido ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label>País</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um país" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Escritório principal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => addCountry.mutate()}
                disabled={!selectedCountry || addCountry.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allowed Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Países Permitidos ({allowedCountries.length})
          </CardTitle>
          <CardDescription>
            Apenas usuários destes países podem acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allowedCountries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum país na whitelist</p>
              <p className="text-sm">
                Adicione países acima para permitir acesso
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>País</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Adicionado em</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowedCountries.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell className="font-medium">{country.country_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{country.country_code}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {country.reason || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(country.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCountry.mutate(country.id)}
                        disabled={removeCountry.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Blocked Access Logs */}
      {blockedLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Acessos Bloqueados Recentes
            </CardTitle>
            <CardDescription>
              Últimas tentativas de acesso de países não permitidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {log.country_name || log.country_code || 'Desconhecido'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                    <TableCell>{log.user_email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.reason || 'País não permitido'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
