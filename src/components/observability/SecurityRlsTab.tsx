import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Database, Search } from 'lucide-react';

interface RlsRow { table_name: string; rls_enabled: boolean }

interface Props {
  rlsStatus: RlsRow[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}

export function SecurityRlsTab({ rlsStatus, loading, search, onSearchChange }: Props) {
  const filtered = rlsStatus.filter(t => t.table_name.toLowerCase().includes(search.toLowerCase()));
  const protectedCount = rlsStatus.filter(t => t.rls_enabled).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Lock className="h-4 w-4" /> Tabelas Protegidas
            </div>
            <p className="text-2xl font-bold">{protectedCount} / {rlsStatus.length}</p>
            <Progress
              value={rlsStatus.length > 0 ? (protectedCount / rlsStatus.length) * 100 : 0}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Database className="h-4 w-4" /> Total de Tabelas
            </div>
            <p className="text-2xl font-bold">{rlsStatus.length || '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Esquema Public</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Auditoria de Row Level Security (RLS)</CardTitle>
            <CardDescription>Status de proteção de cada tabela no banco de dados</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar tabelas..."
              className="pl-8"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Status RLS</TableHead>
                <TableHead>Risco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.table_name}>
                  <TableCell className="font-mono text-sm">{row.table_name}</TableCell>
                  <TableCell>
                    <Badge variant={row.rls_enabled ? 'default' : 'destructive'}>
                      {row.rls_enabled ? 'Ativo' : 'Desativado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.rls_enabled ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Protegido</Badge>
                    ) : (
                      <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5">ALTO RISCO</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rlsStatus.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                    Execute 'Sincronizar' para carregar dados de auditoria detalhados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
