import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface Permission {
  name: string;
  module: string;
  action: string;
}

export function usePermissions() {
  const { user } = useAuthContext();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user?.id]);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          permissions (name, module, action),
          user_roles!inner (user_id, is_active)
        `)
        .eq('user_roles.user_id', user?.id)
        .eq('user_roles.is_active', true);

      if (error) throw error;

      const perms = data?.map((rp: any) => rp.permissions).filter(Boolean) || [];
      setPermissions(perms);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

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
