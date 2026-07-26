import { useCallback, useEffect, useRef, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('useRingtoneSettings');

/**
 * Preferência de toque do usuário.
 *
 * Estratégia local-first com sincronização no perfil:
 * 1. valor local (localStorage) é aplicado imediatamente — zero latência;
 * 2. o perfil remoto é lido em seguida e, se houver valor, torna-se a verdade
 *    (permite trocar de dispositivo sem reconfigurar);
 * 3. toda alteração grava local e replica no perfil (best-effort — falha de
 *    rede nunca bloqueia a UI nem descarta a escolha do usuário).
 */
export function useRingtoneSettings() {
  const [presetId, setPresetId] = useState<string>(DEFAULT_RINGTONE_ID);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);


  // Leitura só após montagem: evita divergência em SSR/hidratação.
  useEffect(() => {
    const stored = loadRingtoneSettings();
    setPresetId(stored.presetId);
    setVolume(stored.volume);
  }, []);

  // Hidratação a partir do perfil (multi-dispositivo).
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      setIsSyncing(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id ?? null;
        userIdRef.current = uid;
        if (!cancelled) setUserId(uid);
        if (!uid || cancelled) return;


        const { data, error } = await supabase
          .from('user_profiles')
          .select('ringtone_preset, ringtone_volume')
          .eq('id', uid)

          .maybeSingle();

        if (error) throw error;
        if (!data || cancelled) return;

        if (typeof data.ringtone_preset === 'string' && data.ringtone_preset.length > 0) {
          const resolved = getRingtonePreset(data.ringtone_preset).id;
          setPresetId(resolved);
          saveRingtoneSettings({ presetId: resolved });
        }
        // Numeric do Postgres pode chegar como string: normalizamos sempre.
        if (data.ringtone_volume !== null && data.ringtone_volume !== undefined) {
          const parsed = clampVolume(Number(data.ringtone_volume));
          setVolume(parsed);
          saveRingtoneSettings({ volume: parsed });
        }
      } catch (error) {
        // Preferência é acessória: seguimos com o valor local.
        log.warn('Falha ao carregar preferência de toque do perfil', { error });
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const pushToProfile = useCallback(
    async (patch: { ringtone_preset?: string; ringtone_volume?: number }) => {
      const userId = userIdRef.current;
      if (!userId) return;
      try {
        const { error } = await supabase.from('user_profiles').update(patch).eq('id', userId);
        if (error) throw error;
      } catch (error) {
        log.warn('Falha ao sincronizar preferência de toque', { error });
      }
    },
    [],
  );

  const selectPreset = useCallback(
    (nextId: string) => {
      const resolved = getRingtonePreset(nextId).id;
      setPresetId(resolved);
      saveRingtoneSettings({ presetId: resolved });
      void pushToProfile({ ringtone_preset: resolved });
    },
    [pushToProfile],
  );

  const changeVolume = useCallback(
    (nextVolume: number) => {
      const resolved = clampVolume(nextVolume);
      setVolume(resolved);
      saveRingtoneSettings({ volume: resolved });
      void pushToProfile({ ringtone_volume: resolved });
    },
    [pushToProfile],
  );

  const preview = useCallback(() => {
    previewRingtone(presetId, volume);
  }, [presetId, volume]);

  return {
    presetId,
    volume,
    presets: RINGTONE_PRESETS,
    isSyncing,
    selectPreset,
    changeVolume,
    preview,
  };
}
