import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, UserRole } from './useAuthState';
import { logger } from '@/lib/logger';

const ROLE_PRECEDENCE: UserRole[] = ['admin', 'supervisor', 'agent', 'viewer'];

/**
 * Resolve o papel efetivo a partir de user_roles (fonte de verdade).
 * Le apenas papeis ativos e nao expirados, aplicando precedencia
 * admin > supervisor > agent > viewer. Caindo para user_profiles.role
 * somente se o usuario nao tiver nenhum papel em user_roles.
 */
async function resolveEffectiveRole(userId: string, fallback: UserRole): Promise<UserRole> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, is_active, expires_at')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) return fallback;

  const now = Date.now();
  const active = data
    .filter((r) => r.is_active !== false)
    .filter((r) => !r.expires_at || new Date(r.expires_at).getTime() > now)
    .map((r) => r.role as UserRole);

  for (const role of ROLE_PRECEDENCE) {
    if (active.includes(role)) return role;
  }
  return fallback;
}

export function useAuthProfile() {
  const getProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const profile = data as UserProfile;
      const role = await resolveEffectiveRole(userId, profile.role);
      return { ...profile, role };
    } catch (error) {
      logger.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  return { getProfile };
}
