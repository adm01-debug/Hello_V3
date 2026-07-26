import { useState } from 'react';
import { Check, Laptop, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MAX_DEVICE_LABEL_LENGTH,
  getCurrentDeviceLabel,
  setCurrentDeviceLabel,
} from '@/lib/device-identity';

/**
 * Apelido desta estação de trabalho, usado nos avisos de sincronização.
 * Puramente cosmético e local: nunca participa de autorização.
 */
export function DeviceNameSetting() {
  const [label, setLabel] = useState<string>(() => getCurrentDeviceLabel());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(label);

  const commit = () => {
    setLabel(setCurrentDeviceLabel(draft));
    setEditing(false);
  };

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-2">
      <Laptop className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      {editing ? (
        <>
          <Input
            value={draft}
            maxLength={MAX_DEVICE_LABEL_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') setEditing(false);
            }}
            aria-label="Apelido deste dispositivo"
            className="h-7 flex-1 text-[11px]"
            autoFocus
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={commit}
            aria-label="Salvar apelido do dispositivo"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditing(false)}
            aria-label="Cancelar edição do apelido"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-[11px] text-muted-foreground">
            Este dispositivo: <span className="text-foreground">{label}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setDraft(label);
              setEditing(true);
            }}
            aria-label="Editar apelido deste dispositivo"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
