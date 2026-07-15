import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { CallingHoursDraft, CallingHoursRegion } from './types';
import { normalizeTime } from './types';

const log = logger.create('CallingHours');

interface CheckResult {
  can_call: boolean;
  reason: string;
  current_time?: string;
  timezone?: string;
}

const timeForDB = (t: string | null): string | null => {
  if (!t) return null;
  return t.length === 5 ? `${t}:00` : t;
};

export function useCallingHoursManager() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['calling-hours-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calling_hours_config')
        .select('*')
        .order('region_code', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CallingHoursRegion[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['calling-hours-config'] });

  const createRegion = useCallback(async (draft: CallingHoursDraft) => {
    setSaving(true);
    try {
      const payload = {
        region_code: draft.region_code,
        region_name: draft.region_name,
        timezone: draft.timezone,
        weekday_start: timeForDB(draft.weekday_start)!,
        weekday_end: timeForDB(draft.weekday_end)!,
        saturday_start: timeForDB(draft.saturday_start),
        saturday_end: timeForDB(draft.saturday_end),
        sunday_allowed: draft.sunday_allowed,
        sunday_start: timeForDB(draft.sunday_start),
        sunday_end: timeForDB(draft.sunday_end),
        holidays_allowed: draft.holidays_allowed,
        is_active: draft.is_active,
      };
      const { error } = await supabase.from('calling_hours_config').insert(payload);
      if (error) throw error;
      toast.success('Região criada');
      await invalidate();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar região';
      log.error('createRegion', err);
      if (/duplicate|unique/i.test(msg)) {
        toast.error('Código de região já existe');
      } else if (/permission|row-level/i.test(msg)) {
        toast.error('Você não tem permissão para criar regiões');
      } else {
        toast.error('Erro ao criar', { description: msg });
      }
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateRegion = useCallback(async (id: string, draft: CallingHoursDraft) => {
    setSaving(true);
    try {
      const payload = {
        region_name: draft.region_name,
        timezone: draft.timezone,
        weekday_start: timeForDB(draft.weekday_start)!,
        weekday_end: timeForDB(draft.weekday_end)!,
        saturday_start: timeForDB(draft.saturday_start),
        saturday_end: timeForDB(draft.saturday_end),
        sunday_allowed: draft.sunday_allowed,
        sunday_start: timeForDB(draft.sunday_start),
        sunday_end: timeForDB(draft.sunday_end),
        holidays_allowed: draft.holidays_allowed,
        is_active: draft.is_active,
      };
      const { error } = await supabase
        .from('calling_hours_config')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
      toast.success('Região atualizada');
      await invalidate();
      return true;
    } catch (err: unknown) {
      log.error('updateRegion', err);
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar';
      toast.error('Erro ao salvar', { description: msg });
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleActive = useCallback(async (region: CallingHoursRegion) => {
    const { error } = await supabase
      .from('calling_hours_config')
      .update({ is_active: !region.is_active })
      .eq('id', region.id);
    if (error) {
      toast.error('Falha ao alterar status', { description: error.message });
      return;
    }
    toast.success(region.is_active ? 'Região desativada' : 'Região ativada');
    await invalidate();
  }, []);

  const deleteRegion = useCallback(async (region: CallingHoursRegion) => {
    if (!confirm(`Remover a região "${region.region_name}"?`)) return false;
    const { error } = await supabase
      .from('calling_hours_config')
      .delete()
      .eq('id', region.id);
    if (error) {
      toast.error('Falha ao excluir', { description: error.message });
      return false;
    }
    toast.success('Região removida');
    await invalidate();
    return true;
  }, []);

  const checkNow = useCallback(async (regionCode: string): Promise<CheckResult | null> => {
    try {
      const { data, error } = await supabase.rpc('check_calling_hours', {
        p_region_code: regionCode,
      });
      if (error) throw error;
      return data as unknown as CheckResult;
    } catch (err: unknown) {
      log.error('checkNow', err);
      toast.error('Não foi possível verificar o horário agora');
      return null;
    }
  }, []);

  const stats = useMemo(() => {
    const active = regions.filter((r) => r.is_active).length;
    return {
      total: regions.length,
      active,
      inactive: regions.length - active,
    };
  }, [regions]);

  const formatTime = normalizeTime;

  return {
    regions,
    isLoading,
    saving,
    stats,
    createRegion,
    updateRegion,
    deleteRegion,
    toggleActive,
    checkNow,
    formatTime,
  };
}
