import { useVoipTrunks, type VoipTrunk } from '@/hooks/useVoipTrunks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Loader2 } from 'lucide-react';

import { ptBR } from 'date-fns/locale';
import { safeFormatDatePtBR } from "@/lib/safe-date";

export function VoipInfrastructureTab() {
  const { data: trunks = [], isLoading, refetch } = useVoipTrunks();

  const statusIcons: Record<string, React.ReactNode> = {
    healthy: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    degraded: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    offline: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'healthy': return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Saudável</Badge>;
      case 'degraded': return <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/5">Degradado</Badge>;
      case 'offline': return <Badge variant="destructive">Offline</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Total de Troncos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trunks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Configurados no sistema</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trunks.filter((t: VoipTrunk) => t.last_health_status === 'healthy').length} / {trunks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Troncos em estado saudável</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              Failovers Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trunks.reduce((acc: number, t: VoipTrunk) => acc + (t.failover_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Eventos de cura automática</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Status dos Troncos SIP</CardTitle>
            <CardDescription>Monitoramento de latência e disponibilidade em tempo real</CardDescription>
          </div>
          <button 
            onClick={() => refetch()} 
            className="p-2 hover:bg-muted rounded-full transition-colors"
            title="Atualizar agora"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latência</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Failovers</TableHead>
                <TableHead>Último Check</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trunks.map((trunk: VoipTrunk) => (
                <TableRow key={trunk.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {statusIcons[trunk.last_health_status || 'offline']}
                      {trunk.name}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(trunk.last_health_status)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {trunk.last_health_latency_ms ? `${trunk.last_health_latency_ms}ms` : '--'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{trunk.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    {(trunk.failover_count || 0) > 0 ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        {trunk.failover_count}
                      </Badge>
                    ) : '0'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {trunk.last_health_checked_at 
                      ? safeFormatDatePtBR(trunk.last_health_checked_at, "HH:mm:ss 'em' dd/MM")
                      : 'Nunca'}
                  </TableCell>
                </TableRow>
              ))}
              {trunks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum tronco VoIP cadastrado ou ativo.
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
