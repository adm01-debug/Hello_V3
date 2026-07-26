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
import { getCurrentDeviceLabel, sanitizeDeviceLabel } from '@/lib/device-identity';
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
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState<number | null>(null);
  const [remoteDevice, setRemoteDevice] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  /** Rótulo deste dispositivo, calculado uma vez (evita ler navigator a cada render). */
  const deviceLabelRef = useRef<string>(getCurrentDeviceLabel());


  /** Último valor efetivamente aplicado aqui — usado para ignorar o eco da própria escrita. */
  const localRef = useRef<{ presetId: string; volume: number }>({
    presetId: DEFAULT_RINGTONE_ID,
    volume: DEFAULT_VOLUME,
  });

  // Leitura só após montagem: evita divergência em SSR/hidratação.
  useEffect(() => {
    const stored = loadRingtoneSettings();
    setPresetId(stored.presetId);
    setVolume(stored.volume);
    localRef.current = { presetId: stored.presetId, volume: stored.volume };
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
          localRef.current.presetId = resolved;
          setPresetId(resolved);
          saveRingtoneSettings({ presetId: resolved });
        }
        // Numeric do Postgres pode chegar como string: normalizamos sempre.
        if (data.ringtone_volume !== null && data.ringtone_volume !== undefined) {
          const parsed = clampVolume(Number(data.ringtone_volume));
          localRef.current.volume = parsed;
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

  /**
   * Propagação em tempo real: quando o perfil é atualizado em outra aba ou
   * dispositivo, o toque muda aqui sem recarregar a página. Os valores vindos
   * do banco passam pelos mesmos normalizadores usados na escrita, então um
   * preset removido ou um volume fora de faixa degrada para o padrão.
   *
   * Eco da própria escrita: a atualização feita neste dispositivo também volta
   * pelo canal. Comparamos com o último valor gravado localmente e só sinalizamos
   * "atualizado em outro dispositivo" quando algo de fato divergiu.
   */
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`ringtone-profile-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const next = payload.new as {
            ringtone_preset?: unknown;
            ringtone_volume?: unknown;
            ringtone_updated_by_device?: unknown;
          } | null;
          if (!next) return;

          let changed = false;

          if (typeof next.ringtone_preset === 'string' && next.ringtone_preset.length > 0) {
            const resolved = getRingtonePreset(next.ringtone_preset).id;
            if (resolved !== localRef.current.presetId) changed = true;
            localRef.current.presetId = resolved;
            setPresetId(resolved);
            saveRingtoneSettings({ presetId: resolved });
          }
          if (next.ringtone_volume !== null && next.ringtone_volume !== undefined) {
            const parsed = clampVolume(Number(next.ringtone_volume));
            if (Math.abs(parsed - localRef.current.volume) > 0.001) changed = true;
            localRef.current.volume = parsed;
            setVolume(parsed);
            saveRingtoneSettings({ volume: parsed });
          }

          if (changed) {
            const origin = sanitizeDeviceLabel(next.ringtone_updated_by_device);
            // Origem igual a este dispositivo indica eco de outra aba local:
            // ainda avisamos, mas sem atribuir a um aparelho diferente.
            const remote = origin && origin !== deviceLabelRef.current ? origin : null;
            setRemoteDevice(remote);
            setRemoteUpdatedAt(Date.now());
            pushSyncEvent(userId, {
              subject: 'Toque',
              detail: getRingtonePreset(localRef.current.presetId).label,
              device: remote,
            });
          }

        },
      )

      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);



  const pushToProfile = useCallback(
    async (patch: { ringtone_preset?: string; ringtone_volume?: number }) => {
      const userId = userIdRef.current;
      if (!userId) return;
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            ...patch,
            // Rastro de origem: cosmético, nunca usado para autorização.
            ringtone_updated_by_device: deviceLabelRef.current,
            ringtone_updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        if (error) throw error;
      } catch (error) {
        log.warn('Falha ao sincronizar preferência de toque', { error });
      }
    },
    [],
  );

  const clearRemoteNotice = useCallback(() => {
    setRemoteUpdatedAt(null);
    setRemoteDevice(null);
  }, []);

  const selectPreset = useCallback(
    (nextId: string) => {
      const resolved = getRingtonePreset(nextId).id;
      localRef.current.presetId = resolved;
      setPresetId(resolved);
      clearRemoteNotice();
      saveRingtoneSettings({ presetId: resolved });
      void pushToProfile({ ringtone_preset: resolved });
    },
    [pushToProfile, clearRemoteNotice],
  );

  const changeVolume = useCallback(
    (nextVolume: number) => {
      const resolved = clampVolume(nextVolume);
      localRef.current.volume = resolved;
      setVolume(resolved);
      clearRemoteNotice();
      saveRingtoneSettings({ volume: resolved });
      void pushToProfile({ ringtone_volume: resolved });
    },
    [pushToProfile, clearRemoteNotice],
  );

  /** Volta preset e volume aos padrões de fábrica, local e remotamente. */
  const resetToDefaults = useCallback(() => {
    localRef.current = { presetId: DEFAULT_RINGTONE_ID, volume: DEFAULT_VOLUME };
    setPresetId(DEFAULT_RINGTONE_ID);
    setVolume(DEFAULT_VOLUME);
    clearRemoteNotice();
    saveRingtoneSettings({ presetId: DEFAULT_RINGTONE_ID, volume: DEFAULT_VOLUME });
    void pushToProfile({ ringtone_preset: DEFAULT_RINGTONE_ID, ringtone_volume: DEFAULT_VOLUME });
  }, [pushToProfile, clearRemoteNotice]);

  const preview = useCallback(() => {
    previewRingtone(presetId, volume);
  }, [presetId, volume]);

  /** Dispensa o aviso de "atualizado em outro dispositivo". */
  const acknowledgeRemoteUpdate = clearRemoteNotice;

  const isDefault = presetId === DEFAULT_RINGTONE_ID && Math.abs(volume - DEFAULT_VOLUME) < 0.001;

  return {
    presetId,
    volume,
    presets: RINGTONE_PRESETS,
    isSyncing,
    isDefault,
    deviceLabel: deviceLabelRef.current,
    remoteUpdatedAt,
    remoteDevice,
    acknowledgeRemoteUpdate,
    resetToDefaults,
    selectPreset,
    changeVolume,
    preview,
  };

}
