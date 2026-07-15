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
    } else if (data) {
      setSettings(data as QueueMetricsSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const save = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    const { id, ...rest } = settings;
    const { error } = await supabase
      .from('queue_metrics_settings')
      .update(rest)
      .eq('id', id);

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
