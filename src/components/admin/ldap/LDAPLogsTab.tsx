import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { SyncLog } from './types';

import { safeToLocaleString } from "@/lib/safe-date";
function statusIcon(status: SyncLog['status']) {
  switch (status) {
    case 'success': return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'partial': return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
  }
}

export function LDAPLogsTab({ logs }: { logs: SyncLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Sincronização</CardTitle>
        <CardDescription>Últimas sincronizações realizadas</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Sincronizados</TableHead>
              <TableHead>Criados</TableHead>
              <TableHead>Atualizados</TableHead>
              <TableHead>Falhas</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{statusIcon(log.status)}</TableCell>
                <TableCell className="text-sm">
                  {safeToLocaleString(log.timestamp, 'pt-BR')}
                </TableCell>
                <TableCell>{log.contactsSynced}</TableCell>
                <TableCell>{log.contactsCreated}</TableCell>
                <TableCell>{log.contactsUpdated}</TableCell>
                <TableCell>
                  {log.contactsFailed > 0 ? (
                    <span className="text-destructive">{log.contactsFailed}</span>
                  ) : (
                    '0'
                  )}
                </TableCell>
                <TableCell>{log.duration}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {log.error || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
