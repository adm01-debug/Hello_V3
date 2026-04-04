import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export function useIPValidation() {
  const validateIP = useCallback(async () => {
    try {
      // SEC-001 FIX: No longer sends userId/userEmail in body
      // The edge function now extracts user identity from JWT
      const { data, error } = await supabase.functions.invoke('validate-ip');

      if (error) {
        logger.error('IP validation error:', error);
        // On error, allow access (fail-open for this optional feature)
        return { allowed: true, error: error.message };
      }

      return data;
    } catch (error) {
      logger.error('IP validation exception:', error);
      return { allowed: true, error: 'Validation service unavailable' };
    }
  }, []);

  return { validateIP };
}
