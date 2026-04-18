import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { useSaveTrunk, type VoipTrunk, type VoipProvider } from '@/hooks/useVoipTrunks';

const schema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  provider: z.enum(['nvoip', 'directcall', 'totalvoice', 'generic', 'wavoip']),
  sip_server: z.string().trim().min(1, 'Servidor obrigatório').max(255),
  sip_username: z.string().trim().min(1, 'Usuário obrigatório').max(100),
  sip_password: z.string().min(0).max(255).optional(),
  sip_realm: z.string().max(255).optional(),
  transport: z.enum(['wss', 'tcp', 'udp']),
  max_channels: z.coerce.number().min(1).max(1000),
  priority: z.coerce.number().min(0).max(9999),
  is_active: z.boolean(),
  notes: z.string().max(500).optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  trunk?: VoipTrunk | null;
}

export function VoipTrunkFormDrawer({ open, onOpenChange, trunk }: Props) {
  const save = useSaveTrunk();
  const [form, setForm] = useState({
    name: '', provider: 'generic' as VoipProvider, sip_server: '', sip_username: '',
    sip_password: '', sip_realm: '', transport: 'wss' as const, max_channels: 10,
    priority: 100, is_active: true, notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trunk) {
      setForm({
        name: trunk.name, provider: trunk.provider, sip_server: trunk.sip_server,
        sip_username: trunk.sip_username, sip_password: '', sip_realm: trunk.sip_realm ?? '',
        transport: trunk.transport, max_channels: trunk.max_channels, priority: trunk.priority,
        is_active: trunk.is_active, notes: trunk.notes ?? '',
      });
    } else {
      setForm({
        name: '', provider: 'generic', sip_server: '', sip_username: '', sip_password: '',
        sip_realm: '', transport: 'wss', max_channels: 10, priority: 100, is_active: true, notes: '',
      });
    }
    setErrors({});
  }, [trunk, open]);

  const handleSubmit = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    const payload: Record<string, unknown> = { ...parsed.data };
    if (trunk) { payload.id = trunk.id; payload.version = trunk.version; }
    if (!payload.sip_password) delete payload.sip_password;
    save.mutate(payload, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{trunk ? 'Editar Linha VoIP' : 'Nova Linha VoIP'}</SheetTitle>
          <SheetDescription>
            {trunk ? 'Atualize as credenciais da operadora.' : 'Cadastre uma nova operadora SIP.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Linha Principal Nvoip" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Operadora</Label>
              <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v as VoipProvider })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nvoip">Nvoip</SelectItem>
                  <SelectItem value="directcall">Directcall</SelectItem>
                  <SelectItem value="totalvoice">TotalVoice</SelectItem>
                  <SelectItem value="wavoip">Wavoip (WhatsApp)</SelectItem>
                  <SelectItem value="generic">Genérico SIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transporte</Label>
              <Select value={form.transport} onValueChange={(v) => setForm({ ...form, transport: v as 'wss' | 'tcp' | 'udp' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wss">WSS (WebSocket Seguro)</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sip_server">Servidor SIP</Label>
            <Input id="sip_server" value={form.sip_server} onChange={e => setForm({ ...form, sip_server: e.target.value })} placeholder="sip.operadora.com.br" />
            {errors.sip_server && <p className="text-xs text-destructive">{errors.sip_server}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sip_username">Usuário SIP</Label>
            <Input id="sip_username" value={form.sip_username} onChange={e => setForm({ ...form, sip_username: e.target.value })} />
            {errors.sip_username && <p className="text-xs text-destructive">{errors.sip_username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sip_password">Senha SIP {trunk && <span className="text-xs text-muted-foreground">(deixe vazio para manter)</span>}</Label>
            <Input id="sip_password" type="password" value={form.sip_password} onChange={e => setForm({ ...form, sip_password: e.target.value })} placeholder="••••••••" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sip_realm">Realm (opcional)</Label>
            <Input id="sip_realm" value={form.sip_realm} onChange={e => setForm({ ...form, sip_realm: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="max_channels">Canais Máx</Label>
              <Input id="max_channels" type="number" value={form.max_channels} onChange={e => setForm({ ...form, max_channels: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input id="priority" type="number" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Linha ativa</Label>
            <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending} className="gap-2">
            <Save className="h-4 w-4" /> {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
