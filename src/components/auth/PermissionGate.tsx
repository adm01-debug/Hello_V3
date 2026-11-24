import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { EmptyPermissionState } from '@/components/ui/empty-state';

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
  fallback,
  module,
  action,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canAccess, loading } = usePermissions();

  if (loading) return null;

  // Sem fallback explicito a negativa vira mensagem padrao em vez de area em branco.
  const denied = fallback === undefined ? <EmptyPermissionState /> : fallback;

  if (module) {
    if (canAccess(module, action)) return <>{children}</>;
    return <>{denied}</>;
  }

  if (permission) {
    if (hasPermission(permission)) return <>{children}</>;
    return <>{denied}</>;
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (hasAccess) return <>{children}</>;
    return <>{denied}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
