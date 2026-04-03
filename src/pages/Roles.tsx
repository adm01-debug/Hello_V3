
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Users, Shield, UserPlus, Trash2, Search, Crown, User, Eye } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  granted_at: string | null;
  expires_at: string | null;
  granted_by?: string | null;
  user_email?: string;
  user_name?: string | null;
  [key: string]: unknown;
}

const ROLE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  admin: { label: 'Administrador', icon: Crown, color: 'bg-destructive' },
  supervisor: { label: 'Supervisor', icon: Shield, color: 'bg-info' },
  agent: { label: 'Agente', icon: User, color: 'bg-success' },
  viewer: { label: 'Visualizador', icon: Eye, color: 'bg-muted-foreground' },
};

export default function Roles() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('agent');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    try {
      // Buscar roles com informações do usuário
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('granted_at', { ascending: false });

      if (error) throw error;

      // Buscar emails dos usuários via user_profiles
      const userIds = [...new Set(roles?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedRoles = roles?.map(role => ({
        ...role,
        user_email: profileMap.get(role.user_id)?.email,
        user_name: profileMap.get(role.user_id)?.full_name,
      })) || [];

      setUserRoles(enrichedRoles as UserRole[]);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Erro ao carregar roles');
    } finally {
      setIsLoading(false);
    }
  };

  const addRole = async () => {
    if (!newUserEmail || !selectedRole) return;

    setAdding(true);
    try {
      // Buscar usuário pelo email
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newUserEmail)
        .maybeSingle();

      if (profileError || !profile) {
        toast.error('Usuário não encontrado', {
          description: 'Verifique o email e tente novamente.',
        });
        return;
      }

      // Adicionar role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: selectedRole as any,
          granted_by: user?.id,
          is_active: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Role já existe', {
            description: 'Este usuário já possui esta role.',
          });
        } else {
          throw error;
        }
        return;
      }

      toast.success('Role adicionada com sucesso!');
      setIsDialogOpen(false);
      setNewUserEmail('');
      setSelectedRole('agent');
      await loadUserRoles();
    } catch (error: any) {
      toast.error('Erro ao adicionar role', {
        description: error.message,
      });
    } finally {
      setAdding(false);
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Role removida');
      await loadUserRoles();
    } catch (error: any) {
      toast.error('Erro ao remover role', {
        description: error.message,
      });
    }
  };

  const toggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: !currentStatus })
        .eq('id', roleId);

      if (error) throw error;

      toast.success(currentStatus ? 'Role desativada' : 'Role ativada');
      await loadUserRoles();
    } catch (error: any) {
      toast.error('Erro ao atualizar role');
    }
  };

  const filteredRoles = userRoles.filter(role =>
    role.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStats = {
    admin: userRoles.filter(r => r.role === 'admin' && r.is_active).length,
    supervisor: userRoles.filter(r => r.role === 'supervisor' && r.is_active).length,
    agent: userRoles.filter(r => r.role === 'agent' && r.is_active).length,
    viewer: userRoles.filter(r => r.role === 'viewer' && r.is_active).length,
  };

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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Role ao Usuário</DialogTitle>
              <DialogDescription>
                Atribua uma role a um usuário existente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Usuário</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, { label, icon: Icon }]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={addRole} disabled={adding || !newUserEmail}>
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(ROLE_LABELS).map(([role, { label, icon: Icon, color }]) => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{roleStats[role as keyof typeof roleStats]}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}/10`}>
                  <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários e Roles</CardTitle>
              <CardDescription>
                Lista de todos os usuários e suas roles atribuídas
              </CardDescription>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atribuída em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma role encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => {
                  const roleInfo = ROLE_LABELS[role.role] || ROLE_LABELS.agent;
                  const RoleIcon = roleInfo.icon;
                  
                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{role.user_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{role.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={role.is_active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleRoleStatus(role.id, role.is_active)}
                        >
                          {role.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(role.granted_at ?? 0).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {role.expires_at 
                          ? new Date(role.expires_at).toLocaleDateString('pt-BR')
                          : 'Permanente'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
