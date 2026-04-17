import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toLocale } from '@/lib/language-detection';

export interface CulturalHint {
  id: string;
  locale: string;
  context_type: string;
  hint_text: string;
  severity: 'info' | 'warning' | 'critical';
}

export function useCulturalHints(langCode?: string) {
  const [hints, setHints] = useState<CulturalHint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!langCode) { setHints([]); return; }
    const locale = toLocale(langCode);
    let cancel = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('cultural_hints')
          .select('*')
          .eq('locale', locale)
          .eq('is_active', true)
          .order('severity', { ascending: false });
        if (error) throw error;
        if (!cancel) setHints((data ?? []) as CulturalHint[]);
      } catch (e) {
        logger.error('useCulturalHints', e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [langCode]);

  return { hints, loading };
}
