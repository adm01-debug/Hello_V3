import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, History, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuditEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_email: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
}

type PeriodFilter = '24h' | '7d' | '30d' | 'all';
const PAGE_SIZE = 25;

const PERIOD_HOURS: Record<PeriodFilter, number | null> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  all: null,
};

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
    return role ? `permissão ${permId ?? ''} para "${role}"`.trim() : 'alteração em permissões';
  }
  return entry.action;
}

function toCsv(rows: AuditEntry[]): string {
  const header = ['data', 'operacao', 'recurso', 'ator', 'descricao', 'resource_id'];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((r) => {
    const meta = operationMeta(r.action);
    return [
      r.created_at,
      meta.label,
      RESOURCE_LABEL[r.resource_type] ?? r.resource_type,
      r.user_email ?? 'sistema',
      describeChange(r),
      r.resource_id ?? '',
    ].map((c) => escape(String(c))).join(',');
  });
  return [header.join(','), ...lines].join('\n');
}

export function RoleAuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [actorQuery, setActorQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const cutoffIso = useMemo(() => {
    const hours = PERIOD_HOURS[period];
    if (hours === null) return null;
    return new Date(Date.now() - hours * 3_600_000).toISOString();
  }, [period]);

  const buildBase = useCallback(() => {
    let q = supabase
      .from('audit_logs')
      .select('id, action, resource_type, resource_id, user_email, created_at, details', {
        count: 'exact',
      })
      .in('resource_type', ['user_roles', 'role_permissions']);
    if (cutoffIso) q = q.gte('created_at', cutoffIso);
    const term = actorQuery.trim();
    if (term) q = q.ilike('user_email', `%${term}%`);
    return q;
  }, [cutoffIso, actorQuery]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, error, count } = await buildBase()
          .order('created_at', { ascending: false })
          .range(from, to);
        if (error) throw error;
        if (!cancelled) {
          setEntries((data ?? []) as AuditEntry[]);
          setTotalCount(count ?? 0);
        }
      } catch (err) {
        logger.error('Falha ao carregar trilha de auditoria de roles', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildBase, page]);

  useEffect(() => {
    setPage(0);
  }, [period, actorQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await buildBase()
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      const csv = toCsv((data ?? []) as AuditEntry[]);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roles-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado', { description: `${data?.length ?? 0} registros` });
    } catch (err) {
      logger.error('Falha no export CSV da auditoria', err);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Trilha de auditoria</CardTitle>
              <CardDescription>Alterações em roles e permissões — quem alterou e quando</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={actorQuery}
                onChange={(e) => setActorQuery(e.target.value)}
                placeholder="Filtrar por ator (email)"
                className="h-8 pl-7 text-xs w-[200px]"
              />
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleExport}
              disabled={isExporting || totalCount === 0}
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma alteração para os filtros aplicados.
          </p>
        ) : (
          <>
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
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {totalCount === 0
                  ? 'Nenhum registro'
                  : `Página ${page + 1} de ${totalPages} · ${totalCount} registros`}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
