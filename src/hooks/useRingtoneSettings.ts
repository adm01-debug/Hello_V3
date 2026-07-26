import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_RINGTONE_ID,
  DEFAULT_VOLUME,
  clampVolume,
  getRingtonePreset,
  loadRingtoneSettings,
  saveRingtoneSettings,
  RINGTONE_PRESETS,
} from '@/lib/ringtone-presets';
import { previewRingtone } from '@/lib/incoming-call-alert';

/** Preferência de toque do usuário, persistida localmente por dispositivo. */
export function useRingtoneSettings() {
  const [presetId, setPresetId] = useState<string>(DEFAULT_RINGTONE_ID);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);

  // Leitura só após montagem: evita divergência em SSR/hidratação.
  useEffect(() => {
    const stored = loadRingtoneSettings();
    setPresetId(stored.presetId);
    setVolume(stored.volume);
  }, []);

  const selectPreset = useCallback((nextId: string) => {
    const resolved = getRingtonePreset(nextId).id;
    setPresetId(resolved);
    saveRingtoneSettings({ presetId: resolved });
  }, []);

  const changeVolume = useCallback((nextVolume: number) => {
    const resolved = clampVolume(nextVolume);
    setVolume(resolved);
    saveRingtoneSettings({ volume: resolved });
  }, []);

  const preview = useCallback(() => {
    previewRingtone(presetId, volume);
  }, [presetId, volume]);

  return {
    presetId,
    volume,
    presets: RINGTONE_PRESETS,
    selectPreset,
    changeVolume,
    preview,
  };
}
