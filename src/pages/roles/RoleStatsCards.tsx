import { Card, CardContent } from '@/components/ui/card';
import { ROLE_LABELS, type UserRoleRow } from './types';

interface Props {
  userRoles: UserRoleRow[];
}

export function RoleStatsCards({ userRoles }: Props) {
  const roleStats = {
    admin: userRoles.filter((r) => r.role === 'admin' && r.is_active).length,
    supervisor: userRoles.filter((r) => r.role === 'supervisor' && r.is_active).length,
    agent: userRoles.filter((r) => r.role === 'agent' && r.is_active).length,
    viewer: userRoles.filter((r) => r.role === 'viewer' && r.is_active).length,
  };

  return (
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
  );
}
