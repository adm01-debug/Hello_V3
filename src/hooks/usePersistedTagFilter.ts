import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_TAGS_FILTER, formatTagFilterLabel, type TagFilter } from '@/lib/dialer-favorite-tags';
import { pushSyncEvent } from '@/hooks/useSyncHistory';
import { loadTagFilter, saveTagFilter, sanitizeStoredFilter } from '@/lib/dialer-filter-storage';
import { getCurrentDeviceLabel, sanitizeDeviceLabel } from '@/lib/device-identity';
import { logger } from '@/lib/logger';

const log = logger.create('usePersistedTagFilter');


/**
 * Filtro de etiquetas persistido por usuário, com sincronização no perfil.
 *
 * Ordem de resolução (local-first, sem bloquear a primeira pintura):
 * 1. monta com "Todos" — nunca esconde favoritos antes de saber quem é o usuário;
 * 2. lê o escopo anônimo imediatamente (sessão ainda não resolvida);
 * 3. ao obter o `user.id`, relê no escopo local correto e, em seguida, aplica o
 *    valor do perfil (verdade multi-dispositivo) quando existir;
 * 4. toda alteração grava local e replica no perfil em best-effort — falha de
 *    rede nunca descarta a escolha do agente.
 *
 * O canal realtime do próprio perfil propaga a troca feita em outra aba ou
 * estação. O eco da escrita local é ignorado por comparação de valor.
 */
/**
 * Registra a troca de filtro no histórico curto de sincronização.
 * Best-effort: falhas de storage jamais interrompem a navegação.
 */
function trackFilterChange(uid: string | null, filter: TagFilter, device: string) {
  try {
    pushSyncEvent(uid, {
      subject: 'Filtro de etiquetas',
      detail: formatTagFilterLabel(filter),
      device,
    });
  } catch (error) {
    log.warn('Falha ao registrar evento de filtro de etiquetas', { error });
  }
}

export function usePersistedTagFilter() {
  const [filter, setFilterState] = useState<TagFilter>(ALL_TAGS_FILTER);
  const [userId, setUserId] = useState<string | null>(null);
  const [remoteDevice, setRemoteDevice] = useState<string | null>(null);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState<number | null>(null);
  const userIdRef = useRef<string | null>(null);
  const localRef = useRef<TagFilter>(ALL_TAGS_FILTER);
  const deviceLabelRef = useRef<string>(getCurrentDeviceLabel());


  const applyLocal = useCallback((next: TagFilter) => {
    localRef.current = next;
    setFilterState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Passo 2: valor do escopo anônimo (útil quando não há login).
    const anonymous = loadTagFilter(null);
    if (anonymous !== ALL_TAGS_FILTER) applyLocal(anonymous);

    // Passo 3: escopo real do usuário + perfil.
    const hydrate = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id ?? null;
        userIdRef.current = uid;
        if (cancelled || !uid) return;
        setUserId(uid);

        applyLocal(loadTagFilter(uid));

        const { data, error } = await supabase
          .from('user_profiles')
          .select('dialer_tag_filter')
          .eq('id', uid)
          .maybeSingle();

        if (error) throw error;
        if (cancelled || !data) return;

        const remote = data.dialer_tag_filter;
        if (typeof remote === 'string' && remote.length > 0) {
          const sanitized = sanitizeStoredFilter(remote);
          applyLocal(saveTagFilter(uid, sanitized));
        }
      } catch (error) {
        // Preferência acessória: mantém o valor local silenciosamente.
        log.warn('Falha ao carregar filtro de etiquetas do perfil', { error });
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [applyLocal]);

  // Propagação em tempo real entre abas/dispositivos.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`dialer-filter-profile-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const next = payload.new as {
            dialer_tag_filter?: unknown;
            dialer_filter_updated_by_device?: unknown;
          } | null;
          if (!next || typeof next.dialer_tag_filter !== 'string') return;
          const sanitized = sanitizeStoredFilter(next.dialer_tag_filter);
          if (sanitized === localRef.current) return; // eco da própria escrita
          applyLocal(saveTagFilter(userId, sanitized));
          const origin = sanitizeDeviceLabel(next.dialer_filter_updated_by_device);
          setRemoteDevice(origin && origin !== deviceLabelRef.current ? origin : null);
          setRemoteUpdatedAt(Date.now());
          trackFilterChange(userId, sanitized, origin ?? 'Outro dispositivo');
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, applyLocal]);

  const acknowledgeRemoteUpdate = useCallback(() => {
    setRemoteDevice(null);
    setRemoteUpdatedAt(null);
  }, []);

  const setFilter = useCallback(
    (next: TagFilter) => {
      const uid = userIdRef.current;
      const persisted = saveTagFilter(uid, next);
      applyLocal(persisted);
      trackFilterChange(uid, persisted, deviceLabelRef.current);
      setRemoteDevice(null);
      setRemoteUpdatedAt(null);
      if (!uid) return;
      void (async () => {
        try {
          const { error } = await supabase
            .from('user_profiles')
            .update({
              dialer_tag_filter: persisted,
              dialer_filter_updated_by_device: deviceLabelRef.current,
              dialer_filter_updated_at: new Date().toISOString(),
            })
            .eq('id', uid);
          if (error) throw error;
        } catch (error) {
          log.warn('Falha ao sincronizar filtro de etiquetas', { error });
        }
      })();
    },
    [applyLocal],
  );

  return { filter, setFilter, remoteDevice, remoteUpdatedAt, acknowledgeRemoteUpdate };
}

