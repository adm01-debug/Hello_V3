import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { diffPositions, reorderFavorites } from '@/lib/dialer-favorites-order';
import { normalizeTag } from '@/lib/dialer-favorite-tags';
import { describeFavorite } from '@/lib/favorite-sync-labels';
import { pushSyncEvent } from '@/hooks/useSyncHistory';
import { getCurrentDeviceLabel } from '@/lib/device-identity';

const log = logger.create('DialerFavorites');

export interface DialerFavorite {
  id: string;
  phone: string;
  label: string | null;
  position: number;
  tag: string | null;
}

/**
 * Registra a mudança de favoritos no histórico curto de sincronização.
 * Best-effort: nunca interrompe a mutação principal.
 */
function trackFavoriteChange(userId: string | null, subject: string, detail: string) {
  try {
    pushSyncEvent(userId, { subject, detail, device: getCurrentDeviceLabel() });
  } catch (error) {
    log.warn('Falha ao registrar evento de favorito', { error });
  }
}

const QUERY_KEY = ['dialer-favorites'] as const;
const MAX_FAVORITES = 12;

/** Favoritos do discador persistidos por usuário (RLS por auth.uid()). */
export function useDialerFavorites() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) => {
      const status = (error as { status?: number } | null)?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return failureCount < 2;
    },
    queryFn: async (): Promise<DialerFavorite[]> => {
      const { data, error } = await supabase
        .from('dialer_favorites')
        .select('id, phone, label, position, tag')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });


  const favorites = query.data ?? [];

  const addMutation = useMutation({
    mutationFn: async ({ phone, label }: { phone: string; label?: string | null }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Sessão expirada');
      const { error } = await supabase.from('dialer_favorites').insert({
        user_id: userId,
        phone,
        label: label?.trim() || null,
        position: favorites.length,
      });
      if (error) throw error;
      return { userId, phone, label: label ?? null };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      trackFavoriteChange(
        result?.userId ?? null,
        'Favorito adicionado',
        describeFavorite(result?.label, result?.phone),
      );
      toast.success('Adicionado aos favoritos');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      const duplicate = message.includes('dialer_favorites_unique_phone');
      log.error('Falha ao adicionar favorito', error);
      toast.error(duplicate ? 'Este número já está nos favoritos' : 'Não foi possível salvar o favorito');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const target = favorites.find((favorite) => favorite.id === id) ?? null;
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('dialer_favorites').delete().eq('id', id);
      if (error) throw error;
      return { userId: auth.user?.id ?? null, target };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      trackFavoriteChange(
        result?.userId ?? null,
        'Favorito removido',
        describeFavorite(result?.target?.label, result?.target?.phone),
      );
      toast.success('Removido dos favoritos');
    },
    onError: (error: unknown) => {
      log.error('Falha ao remover favorito', error);
      toast.error('Não foi possível remover o favorito');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (changes: Array<{ id: string; position: number }>) => {
      if (changes.length === 0) return;
      // Atualizações individuais mantêm a RLS por linha e evitam upsert
      // (que exigiria reenviar user_id/phone e poderia colidir com a unicidade).
      const results = await Promise.all(
        changes.map(({ id, position }) =>
          supabase.from('dialer_favorites').update({ position }).eq('id', id),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    },
    onError: (error: unknown) => {
      log.error('Falha ao reordenar favoritos', error);
      toast.error('Não foi possível salvar a nova ordem');
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const tagMutation = useMutation({
    mutationFn: async ({ id, tag }: { id: string; tag: string | null }) => {
      const target = favorites.find((favorite) => favorite.id === id) ?? null;
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('dialer_favorites').update({ tag }).eq('id', id);
      if (error) throw error;
      return { userId: auth.user?.id ?? null, target, tag };
    },
    onSuccess: (result) => {
      const who = describeFavorite(result?.target?.label, result?.target?.phone);
      trackFavoriteChange(
        result?.userId ?? null,
        'Etiqueta do favorito',
        result?.tag ? `${who} → ${result.tag}` : `${who} → sem etiqueta`,
      );
    },
    onError: (error: unknown) => {
      log.error('Falha ao atualizar etiqueta do favorito', error);
      toast.error('Não foi possível salvar a etiqueta');
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  /** Define (ou remove, com `null`) a etiqueta de um favorito. */
  const setFavoriteTag = useCallback(
    (id: string, rawTag: string | null) => {
      const tag = normalizeTag(rawTag);
      const current = favorites.find((favorite) => favorite.id === id);
      if (!current || current.tag === tag) return;
      queryClient.setQueryData<DialerFavorite[]>(
        QUERY_KEY,
        favorites.map((favorite) => (favorite.id === id ? { ...favorite, tag } : favorite)),
      );
      tagMutation.mutate({ id, tag });
    },
    [favorites, queryClient, tagMutation],
  );

  /** Move um favorito de posição, com atualização otimista no cache. */
  const moveFavorite = useCallback(
    (from: number, to: number) => {
      const reordered = reorderFavorites(favorites, from, to);
      const changes = diffPositions(favorites, reordered);
      if (changes.length === 0) return;
      queryClient.setQueryData<DialerFavorite[]>(QUERY_KEY, reordered);
      // `from`/`to` já foram saneados por `reorderFavorites`; recuperamos o
      // item efetivamente movido pela diferença entre as duas listas.
      const moved = reordered.find((favorite, index) => favorites[index]?.id !== favorite.id) ?? null;
      trackFavoriteChange(
        null,
        'Ordem dos favoritos',
        moved
          ? `${describeFavorite(moved.label, moved.phone)} → posição ${
              reordered.findIndex((favorite) => favorite.id === moved.id) + 1
            }`
          : `${changes.length} posição(ões) atualizada(s)`,
      );
      reorderMutation.mutate(changes);
    },
    [favorites, queryClient, reorderMutation],
  );

  const isFavorite = useCallback(
    (phone: string) => favorites.some((favorite) => favorite.phone === phone),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (phone: string, label?: string | null) => {
      const existing = favorites.find((favorite) => favorite.phone === phone);
      if (existing) {
        removeMutation.mutate(existing.id);
        return;
      }
      if (favorites.length >= MAX_FAVORITES) {
        toast.warning(`Limite de ${MAX_FAVORITES} favoritos atingido`);
        return;
      }
      addMutation.mutate({ phone, label });
    },
    [favorites, addMutation, removeMutation],
  );

  return {
    favorites,
    isLoading: query.isLoading,
    isError: query.isError,
    isMutating:
      addMutation.isPending ||
      removeMutation.isPending ||
      reorderMutation.isPending ||
      tagMutation.isPending,
    isFavorite,
    toggleFavorite,
    moveFavorite,
    setFavoriteTag,
    maxFavorites: MAX_FAVORITES,

  };
}
