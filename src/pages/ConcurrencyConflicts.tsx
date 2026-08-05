import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Database, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useOptimisticLockConflicts, type ConflictPeriod } from '@/hooks/useOptimisticLockConflicts';
import { usePageTitle } from '@/hooks/usePageTitle';

import { safeToLocaleString } from "@/lib/safe-date";
const TABLE_OPTIONS = [
  { value: 'all', label: 'Todas as tabelas' },
  { value: 'deals', label: 'Deals' },
  { value: 'contacts', label: 'Contatos' },
  { value: 'agents', label: 'Agentes' },
  { value: 'cadences', label: 'Cadências' },
  { value: 'playbooks', label: 'Playbooks' },
  { value: 'accounts', label: 'Contas' },
  { value: 'success_plans', label: 'Planos de Sucesso' },
];

export default function ConcurrencyConflicts() {
  usePageTitle('Conflitos de Concorrência');
  const [period, setPeriod] = useState<ConflictPeriod>('24h');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const { data, isLoading, error } = useOptimisticLockConflicts(period, tableFilter);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold font-orbitron text-primary">
          Conflitos de Concorrência
        </h1>
        <p className="text-muted-foreground">
          Monitoramento de conflitos de optimistic locking. Use para identificar hotspots de edição simultânea.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as ConflictPeriod)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TABLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive">
            Erro ao carregar conflitos. Tente novamente.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total no período</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{data?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tabelas afetadas</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{data?.topTables.length ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários envolvidos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-3xl font-bold">{data?.topUsers.length ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Timeline de conflitos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (data?.timeline.length ?? 0) === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum conflito registrado no período. ✨
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top 5 Tabelas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-32" /> : (data?.topTables.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : data?.topTables.map((t) => (
              <div key={t.table_name} className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="font-mono text-sm">{t.table_name}</span>
                <Badge variant="secondary">{t.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top 5 Usuários</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-32" /> : (data?.topUsers.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : data?.topUsers.map((u) => (
              <div key={u.user_id} className="flex justify-between items-center p-2 rounded bg-muted/30">
                <span className="font-mono text-xs truncate max-w-[200px]">{u.user_id}</span>
                <Badge variant="secondary">{u.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Conflitos recentes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48" /> : (data?.recent.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum conflito recente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left p-2">Quando</th>
                    <th className="text-left p-2">Tabela</th>
                    <th className="text-left p-2">Registro</th>
                    <th className="text-left p-2">Versões (cliente → atual)</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recent.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">
                        {safeToLocaleString(c.attempted_at, 'pt-BR')}
                      </td>
                      <td className="p-2 font-mono text-xs">{c.table_name}</td>
                      <td className="p-2 font-mono text-xs truncate max-w-[180px]">{c.record_id}</td>
                      <td className="p-2">
                        <Badge variant="outline">{c.client_version ?? '—'} → {c.current_version ?? '—'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
