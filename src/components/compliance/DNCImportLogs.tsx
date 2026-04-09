import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  completed: { label: 'Concluída', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-600' },
  failed: { label: 'Falha', icon: XCircle, className: 'bg-destructive/15 text-destructive' },
  processing: { label: 'Processando', icon: Clock, className: 'bg-warning/15 text-warning' },
  pending: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
};

export function DNCImportLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['dnc-import-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dnc_import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Logs de Importação DNC</CardTitle>
        <CardDescription>Histórico de importações da lista DNC</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma importação registrada</div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Importados</TableHead>
                  <TableHead>Duplicados</TableHead>
                  <TableHead>Falhas</TableHead>
                  <TableHead>Importado por</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => {
                  const status = statusConfig[log.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />{log.file_name}
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${status.className}`}>
                          <StatusIcon className="h-3 w-3" />{status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.total_records}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{log.imported_records}</TableCell>
                      <TableCell className="text-warning font-medium">{log.duplicate_records}</TableCell>
                      <TableCell>
                        {log.failed_records > 0 ? (
                          <span className="text-destructive font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />{log.failed_records}
                          </span>
                        ) : '0'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.imported_by || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
