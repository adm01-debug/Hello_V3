import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AUDIO_PROMPT_KIND_LABELS,
  QUEUE_AUDIO_SLOT_LABELS,
  formatDuration,
  promptsForSlot,
  resolveSlotSelection,
  type QueueAudioPrompt,
  type QueueAudioSlot,
} from '@/lib/queue-audio';

const NONE = '__none__';

export interface QueueAudioSlotSelectProps {
  slot: QueueAudioSlot;
  prompts: readonly QueueAudioPrompt[];
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * Seletor de áudio para um slot da fila. Só lista faixas ativas e do tipo
 * aceito pelo slot, espelhando o trigger `validate_queue_audio_slots`.
 */
export function QueueAudioSlotSelect({
  slot,
  prompts,
  value,
  onChange,
}: QueueAudioSlotSelectProps) {
  const options = promptsForSlot(prompts, slot);
  // Uma faixa desativada depois de salva não pode permanecer selecionada.
  const safeValue = resolveSlotSelection(prompts, slot, value);
  const id = `queue-audio-${slot}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{QUEUE_AUDIO_SLOT_LABELS[slot]}</Label>
      <Select
        value={safeValue ?? NONE}
        onValueChange={(next) => onChange(next === NONE ? null : next)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Nenhum áudio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Nenhum áudio</SelectItem>
          {options.map((prompt) => (
            <SelectItem key={prompt.id} value={prompt.id}>
              {prompt.name} · {AUDIO_PROMPT_KIND_LABELS[prompt.kind]} ·{' '}
              {formatDuration(prompt.duration_seconds)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {options.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhuma faixa ativa deste tipo na biblioteca de áudios.
        </p>
      )}
    </div>
  );
}
