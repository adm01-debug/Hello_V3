import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from './useAuthState';
import { logger } from '@/lib/logger';

export function useAuthProfile() {
  const getProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

       if (error) throw error;
       return (data as unknown as UserProfile) || null;
    } catch (error) {
      logger.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  return { getProfile };
}
