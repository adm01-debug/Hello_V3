import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { DNC_REASONS } from './constants';

interface Props {
  isAdding: boolean;
  onAdd: (payload: { phone: string; reason: string; notes: string | null }) => void;
}

export function AddDNCDialog({ isAdding, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('manual');
  const [notes, setNotes] = useState('');

  const submit = () => {
    if (!phone.trim()) return;
    onAdd({ phone, reason, notes: notes || null });
    setPhone(''); setReason('manual'); setNotes(''); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar à Lista DNC</DialogTitle>
          <DialogDescription>Este número não será mais contatado pelo discador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DNC_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" placeholder="Detalhes adicionais..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!phone.trim() || isAdding}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
