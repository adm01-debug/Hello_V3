import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

export interface SavedFilter<T = unknown> {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  filters: T;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveFilterInput<T = unknown> {
  name: string;
  filters: T;
  isDefault?: boolean;
}

/**
 * Filtros salvos do usuário autenticado (`public.saved_filters`).
 *
 * A tabela já existe com RLS por `user_id` e a unicidade
 * (user_id, entity_type, name) é resolvida por upsert. O banco mantém um único
 * `is_default` por entidade pelo trigger `ensure_single_default_filter`, então o
 * hook nunca precisa limpar o padrão anterior.
 */
export const useSavedFilters = <T = unknown>(entityType: string) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter<T>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedFilters = useCallback(async (): Promise<SavedFilter<T>[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('entity_type', entityType)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (queryError) throw queryError;

      const rows = (data || []) as unknown as SavedFilter<T>[];
      setSavedFilters(rows);
      return rows;
    } catch (err) {
      logger.warn('Falha ao carregar filtros salvos', err);
      setError('Não foi possível carregar seus filtros salvos.');
      setSavedFilters([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    void fetchSavedFilters();
  }, [fetchSavedFilters]);

  const saveFilter = useCallback(
    async ({ name, filters, isDefault = false }: SaveFilterInput<T>) => {
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Dê um nome ao filtro.');
        return { ok: false as const };
      }

      setIsSaving(true);
      setError(null);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (!userId) {
          setError('Entre na sua conta para salvar filtros.');
          return { ok: false as const };
        }

        const { error: upsertError } = await supabase.from('saved_filters').upsert(
          {
            user_id: userId,
            entity_type: entityType,
            name: trimmed,
            filters: filters as unknown as Json,
            is_default: isDefault,
          },
          { onConflict: 'user_id,entity_type,name' },
        );

        if (upsertError) throw upsertError;

        await fetchSavedFilters();
        return { ok: true as const };
      } catch (err) {
        logger.warn('Falha ao salvar filtro', err);
        setError('Não foi possível salvar o filtro.');
        return { ok: false as const };
      } finally {
        setIsSaving(false);
      }
    },
    [entityType, fetchSavedFilters],
  );

  const deleteFilter = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const { error: deleteError } = await supabase.from('saved_filters').delete().eq('id', id);
        if (deleteError) throw deleteError;
        await fetchSavedFilters();
        return { ok: true as const };
      } catch (err) {
        logger.warn('Falha ao remover filtro', err);
        setError('Não foi possível remover o filtro.');
        return { ok: false as const };
      }
    },
    [fetchSavedFilters],
  );

  const setDefaultFilter = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const { error: updateError } = await supabase
          .from('saved_filters')
          .update({ is_default: true })
          .eq('id', id);
        if (updateError) throw updateError;
        await fetchSavedFilters();
        return { ok: true as const };
      } catch (err) {
        logger.warn('Falha ao definir filtro padrão', err);
        setError('Não foi possível definir o filtro padrão.');
        return { ok: false as const };
      }
    },
    [fetchSavedFilters],
  );

  return {
    savedFilters,
    isLoading,
    isSaving,
    error,
    fetchSavedFilters,
    saveFilter,
    deleteFilter,
    setDefaultFilter,
  };
};
