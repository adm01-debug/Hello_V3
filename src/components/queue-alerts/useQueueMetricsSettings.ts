import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { QueueMetricsSettings, UpdateSetting } from './types';

export function useQueueMetricsSettings() {
  const [settings, setSettings] = useState<QueueMetricsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('queue_metrics_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
      setLoading(false);
      return;
    }

    if (data) {
      setSettings(data as QueueMetricsSettings);
      setLoading(false);
      return;
    }

    // Tabela é singleton: sem fallback a página ficava presa em "Configurações não
    // encontradas". O INSERT usa os defaults do schema (todos NOT NULL com default).
    const { data: created, error: insertError } = await supabase
      .from('queue_metrics_settings')
      .insert({})
      .select()
      .single();

    if (insertError) {
      logger.error('Error seeding settings:', insertError);
      toast.error('Erro ao inicializar configurações');
    } else {
      setSettings(created as QueueMetricsSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const save = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    // Payload explícito: `settings` vem de select('*') e carrega created_at/updated_at,
    // que não existem na interface e seriam rejeitados pelo update.
    const { error } = await supabase
      .from('queue_metrics_settings')
      .update({
        enabled: settings.enabled,
        avg_wait_time_warning: settings.avg_wait_time_warning,
        avg_wait_time_critical: settings.avg_wait_time_critical,
        abandonment_rate_warning: settings.abandonment_rate_warning,
        abandonment_rate_critical: settings.abandonment_rate_critical,
        service_level_warning: settings.service_level_warning,
        service_level_critical: settings.service_level_critical,
        check_interval_minutes: settings.check_interval_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id);

    if (error) {
      logger.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas com sucesso');
    }
    setSaving(false);
  }, [settings]);

  const updateSetting: UpdateSetting = useCallback((key, value) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  return { settings, loading, saving, fetchSettings, save, updateSetting };
}
