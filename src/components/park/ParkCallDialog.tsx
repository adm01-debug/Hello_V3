import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CallParkOrbit } from '@/lib/call-park';

export interface ParkCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orbit: CallParkOrbit | null;
  slot: number | null;
  saving: boolean;
  onConfirm: (input: { contactName: string | null; contactPhone: string | null; notes: string | null }) => void;
}

/** Captura os dados mínimos da chamada antes de ocupar a vaga. */
export function ParkCallDialog({
  open,
  onOpenChange,
  orbit,
  slot,
  saving,
  onConfirm,
}: ParkCallDialogProps) {
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setContactName('');
    setContactPhone('');
    setNotes('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Estacionar na vaga {slot ?? '—'}</DialogTitle>
          <DialogDescription>
            {orbit
              ? `Órbita "${orbit.name}". A vaga é liberada automaticamente quando o tempo limite se esgota.`
              : 'Selecione uma vaga livre.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="park-contact-name">Nome do contato</Label>
            <Input
              id="park-contact-name"
              value={contactName}
              maxLength={120}
              placeholder="Opcional"
              onChange={(event) => setContactName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="park-contact-phone">Telefone</Label>
            <Input
              id="park-contact-phone"
              value={contactPhone}
              maxLength={30}
              inputMode="tel"
              placeholder="Opcional"
              onChange={(event) => setContactPhone(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="park-notes">Observação para quem retirar</Label>
            <Textarea
              id="park-notes"
              rows={2}
              value={notes}
              maxLength={300}
              placeholder="Ex.: aguardando o financeiro"
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            disabled={saving || slot === null}
            onClick={() =>
              onConfirm({
                contactName: contactName.trim() || null,
                contactPhone: contactPhone.trim() || null,
                notes: notes.trim() || null,
              })
            }
          >
            {saving ? 'Estacionando…' : 'Estacionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
