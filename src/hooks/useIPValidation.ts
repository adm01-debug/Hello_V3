import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useIPValidation() {
  const validateIP = useCallback(async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-ip', {
        body: { userId, userEmail }
      });

      if (error) {
        console.error('IP validation error:', error);
        // On error, allow access (fail-open for this optional feature)
        return { allowed: true, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('IP validation exception:', error);
      return { allowed: true, error: 'Validation service unavailable' };
    }
  }, []);

  return { validateIP };
}