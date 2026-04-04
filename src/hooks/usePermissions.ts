import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface Permission {
  name: string;
  module: string;
  action: string;
}

export function usePermissions() {
  const { user } = useAuthContext();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      // Step 1: Get user's active roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const roles = userRoles.map(ur => ur.role);

      // Step 2: Get permissions for those roles
      const { data: rolePerms, error: permsError } = await supabase
        .from('role_permissions')
        .select('permissions (name, module, action)')
        .in('role', roles);

      if (permsError) throw permsError;

      const perms: Permission[] = (rolePerms || [])
        .map((rp: { permissions: Permission }) => rp.permissions)
        .filter(Boolean);

      // Deduplicate by name
      const uniquePerms = Array.from(
        new Map(perms.map(p => [p.name, p])).values()
      );

      setPermissions(uniquePerms);
    } catch (error) {
      logger.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const hasPermission = useCallback((permissionName: string): boolean => {
    return permissions.some(p => p.name === permissionName);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.every(name => hasPermission(name));
  }, [hasPermission]);

  const canAccess = useCallback((module: string, action?: string): boolean => {
    return permissions.some(p => 
      p.module === module && (!action || p.action === action)
    );
  }, [permissions]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    refresh: loadPermissions,
  };
}

export default usePermissions;
