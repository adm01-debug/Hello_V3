import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_LABELS, type UserRoleRow } from './types';

interface Props {
  roles: UserRoleRow[];
  onToggle: (id: string, current: boolean) => void;
  onRemove: (id: string) => void;
}

export function RolesTable({ roles, onToggle, onRemove }: Props) {
  return (
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
        {roles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              Nenhuma role encontrada
            </TableCell>
          </TableRow>
        ) : (
          roles.map((role) => {
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
                    onClick={() => onToggle(role.id, role.is_active)}
                  >
                    {role.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(role.granted_at ?? 0).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  {role.expires_at ? new Date(role.expires_at).toLocaleDateString('pt-BR') : 'Permanente'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onRemove(role.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
