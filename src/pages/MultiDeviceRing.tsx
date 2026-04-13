import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Smartphone, Monitor, Phone, Plus, Trash2, GripVertical,
  BellRing, BellOff, Clock, ArrowDownUp, Voicemail, PhoneForwarded,
  Wifi, Settings2, AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMultiDeviceRing } from '@/hooks/useMultiDeviceRing';

const deviceTypeIcons: Record<string, React.ElementType> = { desktop: Monitor, mobile: Smartphone, sip_phone: Phone, softphone: Wifi };
const deviceTypeLabels: Record<string, string> = { desktop: 'Desktop (Navegador)', mobile: 'Celular / App', sip_phone: 'Telefone IP (SIP)', softphone: 'Softphone Externo' };
const fallbackLabels: Record<string, string> = { voicemail: 'Correio de Voz', forward: 'Encaminhar', queue: 'Retornar à Fila' };

const MultiDeviceRing = () => {
  usePageTitle('Multi-Device Ring');

  const {
    devices, ringSettings, isLoading, enabledCount,
    addDialogOpen, setAddDialogOpen, newDevice, setNewDevice,
    addDevice, toggleDevice, deleteDevice, updateSettings,
  } = useMultiDeviceRing();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Multi-device Ring</h1><p className="text-muted-foreground">Configure quais dispositivos tocam quando você recebe uma chamada</p></div>
        <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1.5"><BellRing className="h-3.5 w-3.5" />{enabledCount} dispositivo{enabledCount !== 1 ? 's' : ''} ativo{enabledCount !== 1 ? 's' : ''}</Badge>
      </div>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground"><strong className="text-foreground">Recurso dependente de operadora:</strong> O toque simultâneo em múltiplos dispositivos requer que sua operadora VoIP suporte <strong>SIP Forking</strong>.</div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Settings2 className="h-5 w-5 text-primary" />Estratégia de Toque</CardTitle><CardDescription>Como os dispositivos devem tocar</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label>Modo de Toque</Label>
              <Select value={ringSettings?.ring_strategy || 'simultaneous'} onValueChange={(v) => updateSettings.mutate({ ring_strategy: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simultaneous"><div className="flex items-center gap-2"><BellRing className="h-4 w-4" />Simultâneo</div></SelectItem>
                  <SelectItem value="sequential"><div className="flex items-center gap-2"><ArrowDownUp className="h-4 w-4" />Sequencial</div></SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{ringSettings?.ring_strategy === 'sequential' ? 'Cada dispositivo toca na ordem definida.' : 'Todos os dispositivos tocam ao mesmo tempo.'}</p>
            </div>
            <Separator />
            <div className="space-y-3"><Label>Tempo Limite de Toque</Label>
              <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><Slider value={[ringSettings?.ring_timeout_seconds || 30]} onValueChange={([v]) => updateSettings.mutate({ ring_timeout_seconds: v })} min={10} max={60} step={5} className="flex-1" /><span className="text-sm font-medium w-8 text-right">{ringSettings?.ring_timeout_seconds || 30}s</span></div>
            </div>
            <Separator />
            <div className="space-y-2"><Label>Se Ninguém Atender</Label>
              <Select value={ringSettings?.fallback_action || 'voicemail'} onValueChange={(v) => updateSettings.mutate({ fallback_action: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="voicemail"><div className="flex items-center gap-2"><Voicemail className="h-4 w-4" />{fallbackLabels.voicemail}</div></SelectItem>
                  <SelectItem value="forward"><div className="flex items-center gap-2"><PhoneForwarded className="h-4 w-4" />{fallbackLabels.forward}</div></SelectItem>
                  <SelectItem value="queue"><div className="flex items-center gap-2"><ArrowDownUp className="h-4 w-4" />{fallbackLabels.queue}</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between"><div className="space-y-0.5"><Label>Não Perturbe (DND)</Label><p className="text-xs text-muted-foreground">Silenciar todas as chamadas</p></div><Switch checked={ringSettings?.dnd_enabled || false} onCheckedChange={(v) => updateSettings.mutate({ dnd_enabled: v })} /></div>
            {ringSettings?.dnd_enabled && (<div className="rounded-lg bg-destructive/10 p-3 flex items-center gap-2"><BellOff className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive font-medium">DND ativado — nenhum dispositivo tocará</span></div>)}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="flex items-center gap-2 text-lg"><BellRing className="h-5 w-5 text-primary" />Meus Dispositivos</CardTitle><CardDescription>Gerencie os dispositivos que recebem chamadas</CardDescription></div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Adicionar</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Adicionar Dispositivo</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2"><Label>Nome do Dispositivo</Label><Input placeholder="Ex: Meu Celular" value={newDevice.device_name} onChange={(e) => setNewDevice(p => ({ ...p, device_name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Tipo</Label>
                    <Select value={newDevice.device_type} onValueChange={(v) => setNewDevice(p => ({ ...p, device_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(deviceTypeLabels).map(([value, label]) => { const Icon = deviceTypeIcons[value]; return <SelectItem key={value} value={value}><div className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</div></SelectItem>; })}</SelectContent>
                    </Select>
                  </div>
                  {(newDevice.device_type === 'sip_phone' || newDevice.device_type === 'softphone') && (<div className="space-y-2"><Label>URI SIP</Label><Input placeholder="sip:ramal@servidor.com" value={newDevice.sip_uri} onChange={(e) => setNewDevice(p => ({ ...p, sip_uri: e.target.value }))} /></div>)}
                  <div className="space-y-2"><Label>Ramal (opcional)</Label><Input placeholder="Ex: 1001" value={newDevice.extension} onChange={(e) => setNewDevice(p => ({ ...p, extension: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => addDevice.mutate(newDevice)} disabled={!newDevice.device_name || addDevice.isPending}>{addDevice.isPending ? 'Adicionando...' : 'Adicionar Dispositivo'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>)
            : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4"><Phone className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="font-medium text-foreground mb-1">Nenhum dispositivo cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">Adicione seus dispositivos para receber chamadas em todos eles</p>
                <Button variant="outline" onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Adicionar primeiro dispositivo</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device, index) => {
                  const Icon = deviceTypeIcons[device.device_type] || Phone;
                  return (
                    <div key={device.id} className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${device.is_enabled ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-60'}`}>
                      {ringSettings?.ring_strategy === 'sequential' && (<div className="flex flex-col items-center text-muted-foreground"><GripVertical className="h-4 w-4" /><span className="text-xs font-medium">{index + 1}º</span></div>)}
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-medium text-foreground truncate">{device.device_name}</span><Badge variant="secondary" className="text-xs shrink-0">{deviceTypeLabels[device.device_type] || device.device_type}</Badge></div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {device.sip_uri && <span>SIP: {device.sip_uri}</span>}
                          {device.extension && <span>Ramal: {device.extension}</span>}
                          {ringSettings?.ring_strategy === 'sequential' && <span>Atraso: {device.ring_delay_seconds}s</span>}
                        </div>
                      </div>
                      <Switch checked={device.is_enabled} onCheckedChange={(enabled) => toggleDevice.mutate({ id: device.id, enabled })} />
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDevice.mutate(device.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MultiDeviceRing;
