import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_TAGS_FILTER, type TagFilter } from '@/lib/dialer-favorite-tags';
import { loadTagFilter, saveTagFilter } from '@/lib/dialer-filter-storage';

/**
 * Filtro de etiquetas persistido por usuário.
 *
 * Ordem de resolução (local-first, sem bloquear a primeira pintura):
 * 1. monta com "Todos" — nunca esconde favoritos antes de saber quem é o usuário;
 * 2. lê o escopo anônimo imediatamente (sessão ainda não resolvida);
 * 3. ao obter o `user.id`, relê no escopo correto e migra a escolha corrente.
 */
export function usePersistedTagFilter() {
  const [filter, setFilterState] = useState<TagFilter>(ALL_TAGS_FILTER);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Passo 2: valor do escopo anônimo (útil quando não há login).
    const anonymous = loadTagFilter(null);
    if (anonymous !== ALL_TAGS_FILTER) setFilterState(anonymous);

    // Passo 3: escopo real do usuário.
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        const userId = data?.user?.id ?? null;
        if (cancelled || !userId) return;
        userIdRef.current = userId;
        setFilterState(loadTagFilter(userId));
      })
      .catch(() => {
        // Sessão indisponível: mantém o escopo anônimo silenciosamente.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setFilter = useCallback((next: TagFilter) => {
    setFilterState(saveTagFilter(userIdRef.current, next));
  }, []);

  return { filter, setFilter };
}
