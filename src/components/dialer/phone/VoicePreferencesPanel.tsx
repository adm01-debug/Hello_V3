/**
 * Painel de preferências do assistente de voz exposto nas configurações
 * rápidas do discador (fora do overlay do assistente).
 *
 * Reutiliza `useVoicePreferences`, garantindo que qualquer alteração feita
 * aqui siga o mesmo caminho de persistência no perfil e de registro no
 * histórico de sincronização usado pelo overlay.
 */

import { AudioLines, Gauge, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useVoicePreferences } from '@/hooks/useVoicePreferences';
import { formatTtsRate, formatVoiceLabel } from '@/lib/voice-preferences';
import { isSpeechSupported, speak } from '@/lib/voice-speech';

const PREVIEW_TEXT = 'Assistente de voz pronto para discar.';

export function VoicePreferencesPanel() {
  const supported = isSpeechSupported();
  const { ttsEnabled, ttsRate, ttsVoice, voices, toggleTts, cycleRate, cycleVoice } =
    useVoicePreferences();

  const voiceLabel = formatVoiceLabel(voices, ttsVoice);

  return (
    <section
      aria-labelledby="voz-heading"
      className="mt-3 rounded-lg border border-border/50 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3
          id="voz-heading"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          <AudioLines className="h-3.5 w-3.5" aria-hidden="true" /> Assistente de voz
        </h3>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Ouvir prévia da voz do assistente"
          disabled={!supported || !ttsEnabled}
          onClick={() => speak(PREVIEW_TEXT, { rate: ttsRate, voiceUri: ttsVoice })}
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>

      {!supported ? (
        <p className="text-[11px] text-muted-foreground">
          Este navegador não oferece síntese de fala. As preferências continuam salvas no perfil.
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="voice-tts-enabled"
            className="flex items-center gap-2 text-[11px] text-muted-foreground"
          >
            {ttsEnabled ? (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Resposta falada
          </Label>
          <Switch
            id="voice-tts-enabled"
            checked={ttsEnabled}
            disabled={!supported}
            onCheckedChange={() => toggleTts()}
            aria-label="Ativar resposta falada do assistente"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" /> Velocidade da fala
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[11px]"
            disabled={!supported}
            onClick={() => cycleRate()}
            aria-label={`Alterar velocidade da fala. Atual: ${formatTtsRate(ttsRate)}`}
          >
            {formatTtsRate(ttsRate)}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <AudioLines className="h-3.5 w-3.5" aria-hidden="true" /> Voz
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 max-w-[60%] truncate px-3 text-[11px]"
            disabled={!supported || voices.length === 0}
            onClick={() => cycleVoice()}
            aria-label={`Alterar voz do assistente. Atual: ${voiceLabel}`}
          >
            <span className="truncate">{voiceLabel}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
