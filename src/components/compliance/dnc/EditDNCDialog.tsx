import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { DNC_REASONS } from './constants';

export interface DNCItemEditable {
  id: string;
  phone: string;
  reason: string;
  notes: string | null;
  expires_at: string | null;
}

interface Props {
  item: DNCItemEditable;
  isSaving?: boolean;
  onSave: (payload: { id: string; reason: string; notes: string | null; expires_at: string | null }) => void;
}

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function EditDNCDialog({ item, isSaving = false, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(item.reason);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [expires, setExpires] = useState(toDateInput(item.expires_at));

  const reset = () => {
    setReason(item.reason);
    setNotes(item.notes ?? '');
    setExpires(toDateInput(item.expires_at));
  };

  const handleOpenChange = (next: boolean) => {
    if (next) reset();
    setOpen(next);
  };

  const submit = () => {
    onSave({
      id: item.id,
      reason,
      notes: notes.trim() ? notes.trim() : null,
      expires_at: expires ? new Date(`${expires}T23:59:59`).toISOString() : null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Editar ${item.phone} na lista DNC`}
          variant="ghost"
          size="icon"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar entrada da lista DNC</DialogTitle>
          <DialogDescription>
            {item.phone} — o motivo e a validade ficam registrados na lista com efeito regulatório.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={`dnc-reason-${item.id}`}>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id={`dnc-reason-${item.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DNC_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`dnc-notes-${item.id}`}>Observações</Label>
            <Textarea
              id={`dnc-notes-${item.id}`}
              placeholder="Detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`dnc-expires-${item.id}`}>Validade</Label>
            <Input
              id={`dnc-expires-${item.id}`}
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para uma entrada sem prazo. Quem removeu e quando é registrado automaticamente.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}