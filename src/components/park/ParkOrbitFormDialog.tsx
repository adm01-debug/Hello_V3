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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import {
  ACTIONS_REQUIRING_TARGET,
  DEFAULT_ORBIT_DRAFT,
  PARK_LIMITS,
  PARK_TIMEOUT_ACTIONS,
  PARK_TIMEOUT_ACTION_LABELS,
  normalizeOrbitDraft,
  slotCount,
  validateOrbitDraft,
  type CallParkOrbit,
  type CallParkOrbitDraft,
  type ParkTimeoutAction,
} from '@/lib/call-park';

export interface ParkOrbitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orbit: CallParkOrbit | null;
  otherOrbits: readonly CallParkOrbit[];
  saving: boolean;
  onSubmit: (draft: CallParkOrbitDraft) => void;
}

export function ParkOrbitFormDialog({
  open,
  onOpenChange,
  orbit,
  otherOrbits,
  saving,
  onSubmit,
}: ParkOrbitFormDialogProps) {
  const [draft, setDraft] = useState<CallParkOrbitDraft>(DEFAULT_ORBIT_DRAFT);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(orbit ? normalizeOrbitDraft(orbit) : DEFAULT_ORBIT_DRAFT);
    setErrors([]);
  }, [open, orbit]);

  const requiresTarget = ACTIONS_REQUIRING_TARGET.includes(draft.timeout_action);
  const activeOthers = otherOrbits.filter((item) => item.is_active);

  const handleSubmit = () => {
    const normalized = normalizeOrbitDraft(draft);
    const found = validateOrbitDraft(normalized, activeOthers);
    setErrors(found);
    if (found.length > 0) return;
    onSubmit(normalized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{orbit ? 'Editar órbita' : 'Nova órbita de estacionamento'}</DialogTitle>
          <DialogDescription>
            Defina a faixa de vagas e o que acontece quando o tempo de espera se esgota.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orbit-name">Nome</Label>
            <Input
              id="orbit-name"
              value={draft.name}
              maxLength={PARK_LIMITS.maxNameLength}
              placeholder="Ex.: Estacionamento comercial"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orbit-description">Descrição</Label>
            <Textarea
              id="orbit-description"
              rows={2}
              value={draft.description ?? ''}
              maxLength={PARK_LIMITS.maxDescriptionLength}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value || null })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orbit-slot-start">Primeira vaga</Label>
              <Input
                id="orbit-slot-start"
                type="number"
                inputMode="numeric"
                min={PARK_LIMITS.minSlot}
                max={PARK_LIMITS.maxSlot}
                value={draft.slot_start}
                onChange={(event) =>
                  setDraft({ ...draft, slot_start: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orbit-slot-end">Última vaga</Label>
              <Input
                id="orbit-slot-end"
                type="number"
                inputMode="numeric"
                min={PARK_LIMITS.minSlot}
                max={PARK_LIMITS.maxSlot}
                value={draft.slot_end}
                onChange={(event) => setDraft({ ...draft, slot_end: Number(event.target.value) })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {slotCount(draft)} vaga(s) nesta faixa — máximo de {PARK_LIMITS.maxSlotsPerOrbit}.
          </p>

          <div className="space-y-2">
            <Label htmlFor="orbit-timeout">Tempo limite de estacionamento (segundos)</Label>
            <Input
              id="orbit-timeout"
              type="number"
              inputMode="numeric"
              min={PARK_LIMITS.minTimeoutSeconds}
              max={PARK_LIMITS.maxTimeoutSeconds}
              value={draft.park_timeout_seconds}
              onChange={(event) =>
                setDraft({ ...draft, park_timeout_seconds: Number(event.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orbit-action">Quando o tempo esgotar</Label>
            <Select
              value={draft.timeout_action}
              onValueChange={(value) =>
                setDraft({ ...draft, timeout_action: value as ParkTimeoutAction })
              }
            >
              <SelectTrigger id="orbit-action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARK_TIMEOUT_ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {PARK_TIMEOUT_ACTION_LABELS[action]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresTarget && (
            <div className="space-y-2">
              <Label htmlFor="orbit-target">Destino</Label>
              <Input
                id="orbit-target"
                value={draft.timeout_target ?? ''}
                maxLength={PARK_LIMITS.maxTargetLength}
                placeholder="Ramal, nome da fila ou do grupo de toque"
                onChange={(event) =>
                  setDraft({ ...draft, timeout_target: event.target.value || null })
                }
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="orbit-announce">Anunciar número da vaga</Label>
              <p className="text-xs text-muted-foreground">
                O agente ouve a vaga usada logo após estacionar.
              </p>
            </div>
            <Switch
              id="orbit-announce"
              checked={draft.announce_slot}
              onCheckedChange={(checked) => setDraft({ ...draft, announce_slot: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="orbit-active">Órbita ativa</Label>
              <p className="text-xs text-muted-foreground">
                Órbitas inativas não aceitam novos estacionamentos.
              </p>
            </div>
            <Switch
              id="orbit-active"
              checked={draft.is_active}
              onCheckedChange={(checked) => setDraft({ ...draft, is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
