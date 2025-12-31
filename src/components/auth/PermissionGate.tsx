import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthContext } from '@/contexts/AuthContext';

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
  const { isAdmin } = useAuthContext();
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess, loading } = usePermissions();

  // Admin sempre tem acesso
  if (isAdmin) return <>{children}</>;

  if (loading) return null;

  // Verificar por módulo/ação
  if (module) {
    if (canAccess(module, action)) return <>{children}</>;
    return <>{fallback}</>;
  }

  // Verificar permissão única
  if (permission) {
    if (hasPermission(permission)) return <>{children}</>;
    return <>{fallback}</>;
  }

  // Verificar múltiplas permissões
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
