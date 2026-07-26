import { useEffect, useMemo, useState } from 'react';
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
  DEFAULT_RING_GROUP_DRAFT,
  NO_ANSWER_ACTIONS,
  NO_ANSWER_LABELS,
  RING_GROUP_LIMITS,
  RING_STRATEGIES,
  RING_STRATEGY_LABELS,
  normalizeRingGroupDraft,
  sanitizeExtension,
  validateRingGroupDraft,
  type NoAnswerAction,
  type RingGroup,
  type RingGroupDraft,
  type RingStrategy,
} from '@/lib/ring-group';

export interface RingGroupQueueOption {
  id: string;
  name: string;
}

export interface RingGroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: RingGroup | null;
  queues: readonly RingGroupQueueOption[];
  takenExtensions: readonly string[];
  saving: boolean;
  onSubmit: (draft: RingGroupDraft) => void;
}

export function RingGroupFormDialog({
  open,
  onOpenChange,
  group,
  queues,
  takenExtensions,
  saving,
  onSubmit,
}: RingGroupFormDialogProps) {
  const [draft, setDraft] = useState<RingGroupDraft>(DEFAULT_RING_GROUP_DRAFT);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setDraft(
      group
        ? normalizeRingGroupDraft(group)
        : { ...DEFAULT_RING_GROUP_DRAFT },
    );
  }, [open, group]);

  const patch = (values: Partial<RingGroupDraft>) =>
    setDraft((current) => ({ ...current, ...values }));

  const errors = useMemo(
    () =>
      validateRingGroupDraft(normalizeRingGroupDraft(draft), {
        existingExtensions: takenExtensions,
      }),
    [draft, takenExtensions],
  );

  const isForwarding =
    draft.no_answer_action === 'forward_extension' ||
    draft.no_answer_action === 'forward_queue';

  const handleSubmit = () => {
    setTouched(true);
    if (errors.length > 0) return;
    onSubmit(normalizeRingGroupDraft(draft));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group ? 'Editar grupo de toque' : 'Novo grupo de toque'}</DialogTitle>
          <DialogDescription>
            Defina quem toca, em qual ordem e o que acontece quando ninguém atende.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ring-group-name">Nome</Label>
            <Input
              id="ring-group-name"
              value={draft.name}
              maxLength={120}
              placeholder="Ex.: Suporte Nível 1"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ring-group-extension">Ramal virtual (opcional)</Label>
              <Input
                id="ring-group-extension"
                value={draft.extension ?? ''}
                maxLength={20}
                inputMode="tel"
                placeholder="Ex.: 4000"
                onChange={(event) =>
                  patch({ extension: sanitizeExtension(event.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Apenas dígitos e os símbolos * # +.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ring-group-strategy">Estratégia de toque</Label>
              <Select
                value={draft.strategy}
                onValueChange={(value) => patch({ strategy: value as RingStrategy })}
              >
                <SelectTrigger id="ring-group-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RING_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy} value={strategy}>
                      {RING_STRATEGY_LABELS[strategy]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ring-group-description">Descrição (opcional)</Label>
            <Textarea
              id="ring-group-description"
              value={draft.description ?? ''}
              maxLength={500}
              rows={2}
              onChange={(event) => patch({ description: event.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ring-group-timeout">
                Tempo total de toque ({RING_GROUP_LIMITS.ringTimeout.min}–
                {RING_GROUP_LIMITS.ringTimeout.max} s)
              </Label>
              <Input
                id="ring-group-timeout"
                type="number"
                min={RING_GROUP_LIMITS.ringTimeout.min}
                max={RING_GROUP_LIMITS.ringTimeout.max}
                value={draft.ring_timeout_seconds}
                onChange={(event) =>
                  patch({ ring_timeout_seconds: Number(event.target.value) })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ring-group-step">
                Tempo por etapa no modo sequencial ({RING_GROUP_LIMITS.stepTimeout.min}–
                {RING_GROUP_LIMITS.stepTimeout.max} s)
              </Label>
              <Input
                id="ring-group-step"
                type="number"
                min={RING_GROUP_LIMITS.stepTimeout.min}
                max={RING_GROUP_LIMITS.stepTimeout.max}
                value={draft.step_timeout_seconds}
                disabled={draft.strategy !== 'sequential'}
                onChange={(event) =>
                  patch({ step_timeout_seconds: Number(event.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ring-group-noanswer">Se ninguém atender</Label>
              <Select
                value={draft.no_answer_action}
                onValueChange={(value) =>
                  patch({
                    no_answer_action: value as NoAnswerAction,
                    forward_target: null,
                  })
                }
              >
                <SelectTrigger id="ring-group-noanswer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NO_ANSWER_ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {NO_ANSWER_LABELS[action]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isForwarding && (
              <div className="grid gap-2">
                <Label htmlFor="ring-group-target">Destino</Label>
                {draft.no_answer_action === 'forward_queue' ? (
                  <Select
                    value={draft.forward_target ?? ''}
                    onValueChange={(value) => patch({ forward_target: value })}
                  >
                    <SelectTrigger id="ring-group-target">
                      <SelectValue placeholder="Escolha a fila" />
                    </SelectTrigger>
                    <SelectContent>
                      {queues.map((queue) => (
                        <SelectItem key={queue.id} value={queue.id}>
                          {queue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="ring-group-target"
                    value={draft.forward_target ?? ''}
                    maxLength={120}
                    placeholder="Ex.: 2001"
                    onChange={(event) => patch({ forward_target: event.target.value })}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ring-group-skip-busy">Ignorar agentes ocupados</Label>
              <p className="text-xs text-muted-foreground">
                Não toca em quem já está em chamada ou pausado.
              </p>
            </div>
            <Switch
              id="ring-group-skip-busy"
              checked={draft.skip_busy_agents}
              onCheckedChange={(checked) => patch({ skip_busy_agents: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="ring-group-active">Grupo ativo</Label>
            <Switch
              id="ring-group-active"
              checked={draft.is_active}
              onCheckedChange={(checked) => patch({ is_active: checked })}
            />
          </div>

          {touched && errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                <ul className="list-inside list-disc">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando…' : group ? 'Salvar alterações' : 'Criar grupo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
