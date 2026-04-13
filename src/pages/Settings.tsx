import { useState, useEffect } from 'react';
import { SystemMaintenancePanel } from '@/components/settings/SystemMaintenancePanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Bell, 
  Volume2,
  Mic,
  Save,
  Link,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Database,
  Trash2,
  Mail,
  ShieldAlert,
  Timer,
  BarChart3,
  Loader2,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBitrix } from '@/hooks/useBitrix';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';

const Settings = () => {
  usePageTitle('Configurações');

  const [notifications, setNotifications] = useState({
    incomingCalls: true,
    missedCalls: true,
    voicemail: true,
    sound: true,
  });

  const { isConfigured: bitrixConfigured, isLoading: bitrixLoading, checkConfiguration } = useBitrix();

  useEffect(() => {
    checkConfiguration();
  }, [checkConfiguration]);

  const handleSave = () => {
    toast.success('✓ Configurações salvas', { description: 'Suas preferências foram atualizadas' });
  };

  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 pointer-events-none gradient-mesh-intense opacity-30" />
      <div className="relative space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências do sistema</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Link className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="voip" className="gap-2">
            <Phone className="h-4 w-4" />
            VoIP
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2">
            <Volume2 className="h-4 w-4" />
            Áudio
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Wrench className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  LF
                </div>
                <Button variant="outline">Alterar foto</Button>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" defaultValue="Lucas Ferreira" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="lucas@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extension">Ramal</Label>
                  <Input id="extension" defaultValue="1001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select defaultValue="sales">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="admin">Administração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Salvar alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Bitrix24 Integration */}
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
                      {bitrixConfigured === true && (
                        <Badge variant="default" className="bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Conectado
                        </Badge>
                      )}
                      {bitrixConfigured === false && (
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
                      <Link className="h-4 w-4 text-primary" />
                      Webhooks
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Eventos em tempo real entre os sistemas
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
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
                    disabled={bitrixLoading}
                    onClick={() => checkConfiguration()}
                  >
                    {bitrixLoading ? 'Verificando...' : 'Testar Conexão'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VoIP Tab */}
        <TabsContent value="voip">
          <Card>
            <CardHeader>
              <CardTitle>Configurações VoIP</CardTitle>
              <CardDescription>Configure sua conexão com a operadora</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm text-warning">
                  ⚠️ Configuração de operadora VoIP em desenvolvimento. Entre em contato com o suporte para configuração.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">Operadora</Label>
                  <Select defaultValue="nvoip">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nvoip">Nvoip</SelectItem>
                      <SelectItem value="directcall">Directcall</SelectItem>
                      <SelectItem value="totalvoice">TotalVoice (Zenvia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sipServer">Servidor SIP</Label>
                  <Input id="sipServer" placeholder="sip.operadora.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sipUser">Usuário SIP</Label>
                  <Input id="sipUser" placeholder="seu-usuario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sipPass">Senha SIP</Label>
                  <Input id="sipPass" type="password" placeholder="••••••••" />
                </div>
              </div>

              <Button className="gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Salvar configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Escolha quais notificações deseja receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Chamadas recebidas</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando receber uma nova chamada
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.incomingCalls}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, incomingCalls: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Chamadas perdidas</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerta para chamadas não atendidas
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.missedCalls}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, missedCalls: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Mensagens de voz</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar novas mensagens na caixa postal
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.voicemail}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, voicemail: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Som de notificação</Label>
                    <p className="text-sm text-muted-foreground">
                      Reproduzir som ao receber notificações
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.sound}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sound: checked }))}
                  />
                </div>
              </div>

              <Button className="gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Salvar preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audio Tab */}
        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Áudio</CardTitle>
              <CardDescription>Configure microfone e alto-falantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Microfone</Label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <Mic className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Microfone padrão do sistema</SelectItem>
                      <SelectItem value="headset">Headset USB</SelectItem>
                      <SelectItem value="webcam">Microfone da webcam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alto-falante</Label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <Volume2 className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Alto-falante padrão</SelectItem>
                      <SelectItem value="headset">Headset USB</SelectItem>
                      <SelectItem value="speakers">Caixas de som</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Cancelamento de eco</Label>
                    <p className="text-sm text-muted-foreground">Reduz eco durante chamadas</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Supressão de ruído</Label>
                    <p className="text-sm text-muted-foreground">Remove ruídos de fundo</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Ganho automático</Label>
                    <p className="text-sm text-muted-foreground">Ajusta volume automaticamente</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Mic className="h-4 w-4" />
                  Testar microfone
                </Button>
                <Button variant="outline" className="gap-2">
                  <Volume2 className="h-4 w-4" />
                  Testar áudio
                </Button>
              </div>

              <Button className="gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Salvar configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <SystemMaintenancePanel />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

// SystemMaintenancePanel extracted to src/components/settings/SystemMaintenancePanel.tsx

export default Settings;
