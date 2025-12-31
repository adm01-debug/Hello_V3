import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGeoValidation() {
  const validateGeo = useCallback(async (userId?: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-geo', {
        body: { userId, userEmail }
      });

      if (error) {
        console.error('Geo validation error:', error);
        // On error, allow access (fail-open)
        return { allowed: true, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Geo validation exception:', error);
      return { allowed: true, error: 'Validation service unavailable' };
    }
  }, []);

  return { validateGeo };
}
