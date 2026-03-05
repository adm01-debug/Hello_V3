
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Loader2, Shield, Key, Users, Phone, FileText, Settings, 
  Lock, Eye, Edit, Trash2, Plus, Save 
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
}

const MODULE_ICONS: Record<string, any> = {
  users: Users,
  roles: Shield,
  contacts: Phone,
  calls: Phone,
  reports: FileText,
  settings: Settings,
  security: Lock,
  audit: Eye,
  dialer: Phone,
  coaching: Users,
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500',
  supervisor: 'bg-blue-500',
  agent: 'bg-green-500',
  viewer: 'bg-gray-500',
};

export default function Permissions() {
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [permissionsRes, rolePermissionsRes] = await Promise.all([
        supabase.from('permissions').select('*').order('module', { ascending: true }),
        supabase.from('role_permissions').select('*'),
      ]);

      if (permissionsRes.error) throw permissionsRes.error;
      if (rolePermissionsRes.error) throw rolePermissionsRes.error;

      setPermissions(permissionsRes.data || []);
      setRolePermissions(rolePermissionsRes.data || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (role: string, permissionId: string): boolean => {
    const key = `${role}-${permissionId}`;
    if (changes.has(key)) {
      return changes.get(key)!;
    }
    return rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
  };

  const togglePermission = (role: string, permissionId: string) => {
    const key = `${role}-${permissionId}`;
    const currentValue = hasPermission(role, permissionId);
    const newChanges = new Map(changes);
    newChanges.set(key, !currentValue);
    setChanges(newChanges);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const toAdd: { role: string; permission_id: string }[] = [];
      const toRemove: string[] = [];

      changes.forEach((newValue, key) => {
        const [role, permissionId] = key.split('-');
        const existingRp = rolePermissions.find(
          rp => rp.role === role && rp.permission_id === permissionId
        );

        if (newValue && !existingRp) {
          toAdd.push({ role, permission_id: permissionId });
        } else if (!newValue && existingRp) {
          toRemove.push(existingRp.id);
        }
      });

      // Adicionar novas permissões
      if (toAdd.length > 0) {
        const { error } = await supabase.from('role_permissions').insert(toAdd);
        if (error) throw error;
      }

      // Remover permissões
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .in('id', toRemove);
        if (error) throw error;
      }

      toast.success('Permissões salvas com sucesso!');
      setChanges(new Map());
      await loadData();
    } catch (error: any) {
      toast.error('Erro ao salvar permissões', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const roles = ['admin', 'supervisor', 'agent', 'viewer'];

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
            <Key className="h-6 w-6 text-primary" />
            Matriz de Permissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure as permissões para cada role do sistema
          </p>
        </div>
        
        {changes.size > 0 && (
          <Button onClick={saveChanges} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações ({changes.size})
              </>
            )}
          </Button>
        )}
      </div>

      {/* Role Legend */}
      <div className="flex gap-4">
        {roles.map(role => (
          <Badge 
            key={role} 
            variant="outline"
            className={`${selectedRole === role ? ROLE_COLORS[role] + ' text-white' : ''}`}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        ))}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permissões por Módulo</CardTitle>
          <CardDescription>
            Marque as caixas para conceder permissões a cada role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Permissão</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} className="text-center w-[120px]">
                      <Badge variant="outline" className={ROLE_COLORS[role] + ' text-white'}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedPermissions).map(([module, perms]) => {
                  const ModuleIcon = MODULE_ICONS[module] || Key;
                  
                  return (
                    <>
                      <TableRow key={`header-${module}`} className="bg-muted/50">
                        <TableCell colSpan={5} className="font-semibold">
                          <div className="flex items-center gap-2">
                            <ModuleIcon className="h-4 w-4" />
                            {module.charAt(0).toUpperCase() + module.slice(1)}
                          </div>
                        </TableCell>
                      </TableRow>
                      {perms.map(perm => (
                        <TableRow key={perm.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{perm.name}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                          </TableCell>
                          {roles.map(role => {
                            const key = `${role}-${perm.id}`;
                            const isChecked = hasPermission(role, perm.id);
                            const hasChange = changes.has(key);
                            
                            return (
                              <TableCell key={role} className="text-center">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => togglePermission(role, perm.id)}
                                  className={hasChange ? 'border-primary ring-2 ring-primary/20' : ''}
                                  disabled={role === 'admin'} // Admin sempre tem todas as permissões
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {roles.map(role => {
          const count = permissions.filter(p => hasPermission(role, p.id)).length;
          const total = permissions.length;
          const percentage = Math.round((count / total) * 100);
          
          return (
            <Card key={role}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{role}</p>
                    <p className="text-2xl font-bold">{count}/{total}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${ROLE_COLORS[role]}/10`}>
                    <span className={`text-sm font-bold ${ROLE_COLORS[role].replace('bg-', 'text-')}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${ROLE_COLORS[role]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
