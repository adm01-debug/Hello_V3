import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_email: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
}

const RESOURCE_LABEL: Record<string, string> = {
  user_roles: 'Role de usuário',
  role_permissions: 'Permissão de role',
};

function operationMeta(action: string) {
  if (action.startsWith('INSERT')) {
    return { label: 'Criado', icon: Plus, className: 'bg-success/15 text-success border-success/30' };
  }
  if (action.startsWith('UPDATE')) {
    return { label: 'Alterado', icon: Pencil, className: 'bg-info/15 text-info border-info/30' };
  }
  if (action.startsWith('DELETE')) {
    return { label: 'Removido', icon: Trash2, className: 'bg-destructive/15 text-destructive border-destructive/30' };
  }
  return { label: action, icon: History, className: 'bg-muted text-muted-foreground' };
}

function describeChange(entry: AuditEntry): string {
  const details = entry.details ?? {};
  const newData = (details.new_data ?? null) as Record<string, unknown> | null;
  const oldData = (details.old_data ?? null) as Record<string, unknown> | null;
  const data = newData ?? oldData ?? {};
  const role = typeof data.role === 'string' ? data.role : null;
  const isActive = typeof data.is_active === 'boolean' ? data.is_active : null;

  if (entry.resource_type === 'user_roles') {
    const parts: string[] = [];
    if (role) parts.push(`role "${role}"`);
    if (entry.action.startsWith('UPDATE') && oldData && newData && oldData.is_active !== newData.is_active) {
      parts.push(newData.is_active ? 'ativada' : 'desativada');
    } else if (isActive === false) {
      parts.push('inativa');
    }
    return parts.join(' — ') || 'alteração em role';
  }

  if (entry.resource_type === 'role_permissions') {
    const permId = data.permission_id;
    return role
      ? `permissão ${permId ?? ''} para "${role}"`.trim()
      : 'alteração em permissões';
  }
  return entry.action;
}

export function RoleAuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('id, action, resource_type, resource_id, user_email, created_at, details')
          .in('resource_type', ['user_roles', 'role_permissions'])
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        if (!cancelled) setEntries((data ?? []) as AuditEntry[]);
      } catch (err) {
        logger.error('Falha ao carregar trilha de auditoria de roles', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Trilha de auditoria</CardTitle>
            <CardDescription>
              Últimas 50 alterações em roles e permissões — quem alterou e quando
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma alteração registrada ainda.
          </p>
        ) : (
          <ScrollArea className="h-[360px] pr-3">
            <ul className="space-y-3">
              {entries.map((entry) => {
                const meta = operationMeta(entry.action);
                const Icon = meta.icon;
                return (
                  <li
                    key={entry.id}
                    className="flex gap-3 items-start rounded-md border border-border bg-card/40 p-3"
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                        meta.className,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', meta.className)}>
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {RESOURCE_LABEL[entry.resource_type] ?? entry.resource_type}
                        </span>
                      </div>
                      <p className="text-sm truncate">{describeChange(entry)}</p>
                      <p className="text-xs text-muted-foreground">
                        Por <span className="font-medium">{entry.user_email ?? 'sistema'}</span> ·{' '}
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
