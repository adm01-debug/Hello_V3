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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  DEFAULT_QUEUE_DRAFT,
  OVERFLOW_ACTIONS,
  OVERFLOW_LABELS,
  QUEUE_LIMITS,
  QUEUE_STRATEGIES,
  STRATEGY_LABELS,
  formatSeconds,
  normalizeQueueDraft,
  ringCyclesWithinWait,
  validateQueueDraft,
  type CallQueue,
  type CallQueueDraft,
} from '@/lib/call-queue';
import { QueueAudioSlotSelect } from '@/components/queues/QueueAudioSlotSelect';
import type { QueueAudioPrompt } from '@/lib/queue-audio';

export interface QueueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: CallQueue | null;
  otherQueues: CallQueue[];
  audioPrompts: readonly QueueAudioPrompt[];
  saving: boolean;
  onSubmit: (draft: CallQueueDraft) => void;
}

const NO_OVERFLOW = '__none__';

export function QueueFormDialog({
  open,
  onOpenChange,
  queue,
  otherQueues,
  saving,
  onSubmit,
}: QueueFormDialogProps) {
  const [draft, setDraft] = useState<CallQueueDraft>(DEFAULT_QUEUE_DRAFT);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(queue ? normalizeQueueDraft(queue) : DEFAULT_QUEUE_DRAFT);
    setErrors([]);
  }, [open, queue]);

  const set = <K extends keyof CallQueueDraft>(key: K, value: CallQueueDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const normalized = normalizeQueueDraft(draft);
    const found = validateQueueDraft(normalized, { selfId: queue?.id ?? null });
    setErrors(found);
    if (found.length > 0) return;
    onSubmit(normalized);
  };

  const cycles = ringCyclesWithinWait(normalizeQueueDraft(draft));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{queue ? 'Editar fila' : 'Nova fila de atendimento'}</DialogTitle>
          <DialogDescription>
            Defina distribuição, capacidade, transbordo e áudio de espera.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="queue-name">Nome da fila</Label>
              <Input
                id="queue-name"
                value={draft.name}
                maxLength={120}
                onChange={(event) => set('name', event.target.value)}
                placeholder="Ex.: Suporte Nível 1"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="queue-description">Descrição</Label>
              <Textarea
                id="queue-description"
                value={draft.description ?? ''}
                maxLength={500}
                rows={2}
                onChange={(event) => set('description', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-strategy">Estratégia de distribuição</Label>
              <Select
                value={draft.strategy}
                onValueChange={(value) => set('strategy', value as CallQueueDraft['strategy'])}
              >
                <SelectTrigger id="queue-strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUEUE_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy} value={strategy}>
                      {STRATEGY_LABELS[strategy]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-priority">
                Prioridade ({QUEUE_LIMITS.priority.min}–{QUEUE_LIMITS.priority.max})
              </Label>
              <Input
                id="queue-priority"
                type="number"
                min={QUEUE_LIMITS.priority.min}
                max={QUEUE_LIMITS.priority.max}
                value={draft.priority}
                onChange={(event) => set('priority', Number(event.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-ring">Toque por agente (s)</Label>
              <Input
                id="queue-ring"
                type="number"
                min={QUEUE_LIMITS.ringTimeout.min}
                max={QUEUE_LIMITS.ringTimeout.max}
                value={draft.ring_timeout_seconds}
                onChange={(event) => set('ring_timeout_seconds', Number(event.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-wrapup">Pós-atendimento (s)</Label>
              <Input
                id="queue-wrapup"
                type="number"
                min={QUEUE_LIMITS.wrapUp.min}
                max={QUEUE_LIMITS.wrapUp.max}
                value={draft.wrap_up_seconds}
                onChange={(event) => set('wrap_up_seconds', Number(event.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-wait">Espera máxima (s)</Label>
              <Input
                id="queue-wait"
                type="number"
                min={QUEUE_LIMITS.maxWait.min}
                max={QUEUE_LIMITS.maxWait.max}
                value={draft.max_wait_seconds}
                onChange={(event) => set('max_wait_seconds', Number(event.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-size">Tamanho máximo da fila</Label>
              <Input
                id="queue-size"
                type="number"
                min={QUEUE_LIMITS.maxSize.min}
                max={QUEUE_LIMITS.maxSize.max}
                value={draft.max_queue_size}
                onChange={(event) => set('max_queue_size', Number(event.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="queue-overflow">Ao estourar o limite</Label>
              <Select
                value={draft.overflow_action}
                onValueChange={(value) =>
                  set('overflow_action', value as CallQueueDraft['overflow_action'])
                }
              >
                <SelectTrigger id="queue-overflow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OVERFLOW_ACTIONS.map((action) => (
                    <SelectItem key={action} value={action}>
                      {OVERFLOW_LABELS[action]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {draft.overflow_action === 'transfer_queue' && (
              <div className="space-y-2">
                <Label htmlFor="queue-overflow-target">Fila de destino</Label>
                <Select
                  value={draft.overflow_queue_id ?? NO_OVERFLOW}
                  onValueChange={(value) =>
                    set('overflow_queue_id', value === NO_OVERFLOW ? null : value)
                  }
                >
                  <SelectTrigger id="queue-overflow-target">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_OVERFLOW}>Não definida</SelectItem>
                    {otherQueues.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="queue-moh" className="cursor-pointer">
                Música em espera
              </Label>
              <Switch
                id="queue-moh"
                checked={draft.moh_enabled}
                onCheckedChange={(checked) => set('moh_enabled', checked)}
              />
            </div>
            {draft.moh_enabled && (
              <>
                <QueueAudioSlotSelect
                  slot="moh_prompt_id"
                  prompts={audioPrompts}
                  value={draft.moh_prompt_id}
                  onChange={(value) => set('moh_prompt_id', value)}
                />
                <Input
                  aria-label="URL do áudio de espera"
                  value={draft.moh_url ?? ''}
                  placeholder="Ou uma URL externa: https://.../espera.mp3"
                  onChange={(event) => set('moh_url', event.target.value)}
                />
              </>
            )}

            <QueueAudioSlotSelect
              slot="greeting_prompt_id"
              prompts={audioPrompts}
              value={draft.greeting_prompt_id}
              onChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  greeting_prompt_id: value,
                  greeting_enabled: value ? prev.greeting_enabled : false,
                }))
              }
            />

            {draft.greeting_prompt_id && (
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="queue-greeting-enabled" className="cursor-pointer">
                  Tocar saudação ao entrar na fila
                </Label>
                <Switch
                  id="queue-greeting-enabled"
                  checked={draft.greeting_enabled}
                  onCheckedChange={(checked) => set('greeting_enabled', checked)}
                />
              </div>
            )}

            <QueueAudioSlotSelect
              slot="periodic_prompt_id"
              prompts={audioPrompts}
              value={draft.periodic_prompt_id}
              onChange={(value) => set('periodic_prompt_id', value)}
            />

            <QueueAudioSlotSelect
              slot="overflow_prompt_id"
              prompts={audioPrompts}
              value={draft.overflow_prompt_id}
              onChange={(value) => set('overflow_prompt_id', value)}
            />


            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="queue-announce" className="cursor-pointer">
                Anunciar posição na fila
              </Label>
              <Switch
                id="queue-announce"
                checked={draft.announce_position}
                onCheckedChange={(checked) => set('announce_position', checked)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="queue-announce-hold" className="cursor-pointer">
                Anunciar tempo estimado de espera
              </Label>
              <Switch
                id="queue-announce-hold"
                checked={draft.announce_hold_time}
                onCheckedChange={(checked) => set('announce_hold_time', checked)}
              />
            </div>

            {(draft.announce_position || draft.announce_hold_time) && (
              <div className="space-y-2">
                <Label htmlFor="queue-announce-interval">Intervalo entre anúncios (s)</Label>
                <Input
                  id="queue-announce-interval"
                  type="number"
                  min={QUEUE_LIMITS.announceInterval.min}
                  max={QUEUE_LIMITS.announceInterval.max}
                  value={draft.announce_interval_seconds}
                  onChange={(event) =>
                    set('announce_interval_seconds', Number(event.target.value))
                  }
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="queue-active" className="cursor-pointer">
              Fila ativa
            </Label>
            <Switch
              id="queue-active"
              checked={draft.is_active}
              onCheckedChange={(checked) => set('is_active', checked)}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Com a configuração atual, cabem <strong>{cycles}</strong> ciclo(s) de toque dentro
            da espera máxima de {formatSeconds(draft.max_wait_seconds)}.
          </p>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.map((message) => (
                    <li key={message}>{message}</li>
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
            {queue ? 'Salvar alterações' : 'Criar fila'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
