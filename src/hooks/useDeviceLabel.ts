import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  getCurrentDeviceLabel,
  isCustomDeviceLabel,
  sanitizeDeviceLabel,
  setCurrentDeviceLabel,
} from '@/lib/device-identity';
import { pushSyncEvent } from '@/hooks/useSyncHistory';

const log = logger.create('useDeviceLabel');

/**
 * Apelido do dispositivo com persistência no perfil do usuário.
 *
 * Estratégia local-first:
 * 1. o valor local (localStorage) é aplicado imediatamente;
 * 2. se este dispositivo ainda usa o rótulo derivado do user agent e o perfil
 *    já tem um apelido salvo, o perfil hidrata o local — permite reencontrar o
 *    apelido após limpar o navegador ou trocar de estação;
 * 3. um apelido definido manualmente aqui sempre vence (hot desking) e é
 *    replicado no perfil em best-effort — falha de rede nunca bloqueia a UI.
 *
 * O rótulo é cosmético: nunca participa de autorização.
 */
export function useDeviceLabel() {
  const [label, setLabel] = useState<string>(() => getCurrentDeviceLabel());
  const [isSyncing, setIsSyncing] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const persist = useCallback(async (value: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    const { error } = await supabase
      .from('user_profiles')
      .update({
        preferred_device_label: value,
        preferred_device_label_updated_at: new Date().toISOString(),
      })
      .eq('id', uid);
    if (error) {
      log.warn('Falha ao salvar apelido do dispositivo no perfil', { error: error.message });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      setIsSyncing(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id ?? null;
        userIdRef.current = uid;
        if (!uid || cancelled) return;

        const { data, error } = await supabase
          .from('user_profiles')
          .select('preferred_device_label')
          .eq('id', uid)
          .maybeSingle();

        if (error) {
          log.warn('Falha ao ler apelido do dispositivo no perfil', { error: error.message });
          return;
        }
        if (cancelled) return;

        const remote = sanitizeDeviceLabel(data?.preferred_device_label);
        const local = getCurrentDeviceLabel();

        if (remote && !isCustomDeviceLabel(local)) {
          // Estação nova/limpa: adota o apelido salvo no perfil.
          const applied = setCurrentDeviceLabel(remote);
          setLabel(applied);
          pushSyncEvent(uid, {
            subject: 'Apelido',
            detail: applied,
            device: null,
          });
        } else if (!remote && isCustomDeviceLabel(local)) {
          // Perfil ainda sem apelido: promove o local.
          await persist(local);
        }
      } catch (err) {
        log.warn('Hidratação do apelido do dispositivo falhou', { err });
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Aplica o apelido localmente (imediato) e replica no perfil. */
  const updateLabel = useCallback(
    (value: unknown) => {
      const applied = setCurrentDeviceLabel(value);
      if (applied !== label) {
        pushSyncEvent(userIdRef.current, {
          subject: 'Apelido',
          detail: applied,
          device: label,
        });
      }
      setLabel(applied);
      void persist(applied);
      return applied;
    },
    [persist, label],
  );

  return { label, updateLabel, isSyncing };
}
