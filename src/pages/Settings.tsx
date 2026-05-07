 import { useState } from 'react';
 import { SystemMaintenancePanel } from '@/components/settings/SystemMaintenancePanel';
 import { ProfileSettings } from '@/components/settings/ProfileSettings';
 import { BitrixIntegration } from '@/components/settings/BitrixIntegration';
 import { VoipSettings } from '@/components/settings/VoipSettings';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Separator } from '@/components/ui/separator';
 import { 
   User, 
   Phone, 
   Bell, 
   Volume2,
   Mic,
   Save,
   Link,
   Wrench,
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { usePageTitle } from '@/hooks/usePageTitle';
 
 const Settings = () => {
   usePageTitle('Configurações');
 
   const [notifications, setNotifications] = useState({
     incomingCalls: true,
     missedCalls: true,
     voicemail: true,
     sound: true,
   });
 
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
 
         <TabsContent value="profile">
           <ProfileSettings />
         </TabsContent>
 
         <TabsContent value="integrations">
           <BitrixIntegration />
         </TabsContent>
 
         <TabsContent value="voip">
           <VoipSettings />
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
