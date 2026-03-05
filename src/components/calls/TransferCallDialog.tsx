import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { TransferTarget, TransferType } from '@/hooks/useMultiChannelCall';
import { PhoneForwarded } from 'lucide-react';

interface TransferCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransfer: (target: TransferTarget) => void;
}

export function TransferCallDialog({ open, onOpenChange, onTransfer }: TransferCallDialogProps) {
  const [transferType, setTransferType] = useState<TransferType>('blind');
  const [targetNumber, setTargetNumber] = useState('');
  const [targetName, setTargetName] = useState('');

  const handleTransfer = () => {
    if (!targetNumber) return;
    onTransfer({
      type: transferType,
      targetNumber,
      targetName: targetName || undefined,
    });
    setTargetNumber('');
    setTargetName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneForwarded className="h-5 w-5" />
            Transferir Chamada
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Transferência</Label>
            <Select value={transferType} onValueChange={(v) => setTransferType(v as TransferType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blind">Cega</SelectItem>
                <SelectItem value="attended">Assistida</SelectItem>
                <SelectItem value="warm">Quente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Número de Destino</Label>
            <Input
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label>Nome (opcional)</Label>
            <Input
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="Nome do destinatário"
            />
          </div>
          <Button onClick={handleTransfer} className="w-full" disabled={!targetNumber}>
            Transferir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
