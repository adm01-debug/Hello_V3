import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  module?: string;
  action?: string;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  module,
  action,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess, loading } = usePermissions();

  if (loading) return null;

  if (module) {
    if (canAccess(module, action)) return <>{children}</>;
    return <>{fallback}</>;
  }

  if (permission) {
    if (hasPermission(permission)) return <>{children}</>;
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (hasAccess) return <>{children}</>;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
