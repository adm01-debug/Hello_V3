import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { DNC_REASONS } from './constants';

interface Props {
  onImport: (phones: string[], reason: string) => void | Promise<void>;
}

export function ImportDNCDialog({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [reason, setReason] = useState('import');

  const submit = async () => {
    const phones = text.split(/[\n,;]/).map(p => p.trim()).filter(p => p.length > 0);
    if (phones.length === 0) return;
    await onImport(phones, reason);
    setText(''); setOpen(false);
  };

  const detected = text.split(/[\n,;]/).filter(p => p.trim()).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Importar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Números em Lote</DialogTitle>
          <DialogDescription>Cole os números de telefone, um por linha ou separados por vírgula.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo da Inclusão</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DNC_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Números de Telefone</Label>
            <Textarea
              placeholder="(11) 99999-9999&#10;(21) 88888-8888&#10;..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">{detected} números detectados</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Importar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
