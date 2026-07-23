import { useState } from 'react';
import { Loader2, Search, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRoles } from './roles/useRoles';
import { RoleStatsCards } from './roles/RoleStatsCards';
import { AddRoleDialog } from './roles/AddRoleDialog';
import { RolesTable } from './roles/RolesTable';
import { RoleAuditTrail } from './roles/RoleAuditTrail';

export default function Roles() {
  usePageTitle('Roles & Permissões');
  const { user } = useAuthContext();
  const { isLoading, userRoles, addRole, removeRole, toggleRoleStatus } = useRoles(user?.id);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoles = userRoles.filter((role) =>
    role.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.role.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestão de Roles
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as permissões dos usuários do sistema
          </p>
        </div>
        <AddRoleDialog onAdd={addRole} />
      </div>

      <RoleStatsCards userRoles={userRoles} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários e Roles</CardTitle>
              <CardDescription>Lista de todos os usuários e suas roles atribuídas</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RolesTable roles={filteredRoles} onToggle={toggleRoleStatus} onRemove={removeRole} />
        </CardContent>
      </Card>
    </div>
  );
}
