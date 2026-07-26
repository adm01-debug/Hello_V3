/**
 * Lógica pura das preferências do assistente de voz.
 *
 * Mantida fora dos hooks para permitir testes baseados em propriedades
 * (PBT) e reutilização entre o overlay e futuras telas de preferências.
 * Toda função é total: nunca lança, sempre devolve valor válido.
 */

import { MAX_HISTORY_ENTRIES, sanitizeCommand, type VoiceCommandEntry } from './voice-command-history';

export const MIN_TTS_RATE = 0.5;
export const MAX_TTS_RATE = 2;
/** Velocidades oferecidas no ciclo do botão do overlay. */
export const TTS_RATE_STEPS = [0.75, 1, 1.25, 1.5] as const;

/** Garante uma velocidade finita dentro do intervalo aceito pelo banco. */
export function clampTtsRate(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 1;
  const bounded = Math.min(MAX_TTS_RATE, Math.max(MIN_TTS_RATE, numeric));
  // 2 casas decimais: mesma precisão de `numeric(3,2)` no banco.
  return Math.round(bounded * 100) / 100;
}

/** Próxima velocidade do ciclo (volta ao início após a última). */
export function nextTtsRate(current: unknown): number {
  const rate = clampTtsRate(current);
  const index = TTS_RATE_STEPS.findIndex((step) => Math.abs(step - rate) < 0.01);
  const next = TTS_RATE_STEPS[(index + 1) % TTS_RATE_STEPS.length];
  return clampTtsRate(next);
}

/** Formata a velocidade para exibição curta (ex.: "1,25x"). */
export function formatTtsRate(value: unknown): string {
  const rate = clampTtsRate(value);
  const text = Number.isInteger(rate) ? String(rate) : rate.toFixed(2).replace(/0$/, '');
  return `${text.replace('.', ',')}x`;
}

/** Converte qualquer payload remoto em entradas válidas de histórico. */
export function parseRemoteHistory(raw: unknown): VoiceCommandEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: VoiceCommandEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as { command?: unknown; at?: unknown };
    const command = sanitizeCommand(candidate.command);
    if (!command) continue;
    const at =
      typeof candidate.at === 'number' && Number.isFinite(candidate.at) && candidate.at > 0
        ? Math.floor(candidate.at)
        : 0;
    entries.push({ command, at });
  }
  return entries.slice(0, MAX_HISTORY_ENTRIES);
}

/**
 * Funde histórico local e remoto: dedupe case-insensitive mantendo a
 * ocorrência mais recente, ordenado do mais novo para o mais antigo e
 * truncado no limite aceito pelo banco.
 */
export function mergeCommandHistories(
  local: readonly VoiceCommandEntry[] | null | undefined,
  remote: readonly VoiceCommandEntry[] | null | undefined,
): VoiceCommandEntry[] {
  const byKey = new Map<string, VoiceCommandEntry>();
  const consume = (list: readonly VoiceCommandEntry[] | null | undefined) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      const command = sanitizeCommand(item?.command);
      if (!command) continue;
      const at = typeof item?.at === 'number' && Number.isFinite(item.at) && item.at > 0 ? Math.floor(item.at) : 0;
      const key = command.toLowerCase();
      const existing = byKey.get(key);
      if (!existing || at > existing.at) byKey.set(key, { command, at });
    }
  };
  consume(local);
  consume(remote);

  return Array.from(byKey.values())
    .sort((a, b) => b.at - a.at || a.command.localeCompare(b.command))
    .slice(0, MAX_HISTORY_ENTRIES);
}
