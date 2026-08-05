import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';

export function useIPValidation() {
  const validateIP = useCallback(async () => {
    try {
      return await withTrace('ip.validate', async () => {
        const { data, error } = await supabase.functions.invoke('validate-ip', {
          headers: traceHeaders(),
        });

        if (error) {
          logger.error('IP validation error:', error);
          return { allowed: true, error: error.message };
        }

        return data;
      });
    } catch (error) {
      logger.error('IP validation exception:', error);
      return { allowed: true, error: 'Validation service unavailable' };
    }
  }, []);

  return { validateIP };
}
