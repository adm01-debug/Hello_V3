import { Database, Download, RefreshCw } from 'lucide-react';
import { NeonPageLayout } from '@/components/layout/NeonPageLayout';
import { NeonPageHeader } from '@/components/layout/NeonPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useDataLakeExports,
  useCreateExport,
  downloadExport,
  type ExportDataset,
  type ExportFormat,
} from '@/hooks/useDataLakeExports';
import { useState } from 'react';

import { ptBR } from 'date-fns/locale';

import { safeFormatDistanceToNow } from "@/lib/safe-date";
const statusVariants = { pending: 'outline', processing: 'default', completed: 'secondary', failed: 'destructive' } as const;

export default function DataExport() {
  usePageTitle('Exportação Data Lake');
  const [dataset, setDataset] = useState<ExportDataset>('call_sessions');
  const [format, setFormat] = useState<ExportFormat>('ndjson');
  const { data: exports = [], isLoading, refetch } = useDataLakeExports();
  const create = useCreateExport();

  const bytesToKB = (b: number | null) => (b === null ? '—' : `${(b / 1024).toFixed(1)} KB`);

  return (
    <NeonPageLayout>
      <NeonPageHeader
        title="Exportação de Data Lake"
        description="Gere exports de datasets críticos para BI externo"
        icon={<Database />}
      />

      <Card className="bg-card/50 backdrop-blur border-primary/20 mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dataset</label>
              <Select value={dataset} onValueChange={(v) => setDataset(v as ExportDataset)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call_sessions">Chamadas</SelectItem>
                  <SelectItem value="deals">Deals</SelectItem>
                  <SelectItem value="contacts">Contatos</SelectItem>
                  <SelectItem value="audit_logs">Logs de auditoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Formato</label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="ndjson">NDJSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => create.mutate({ dataset, format })} disabled={create.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {create.isPending ? 'Gerando…' : 'Exportar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-3">Histórico</h2>
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : exports.length === 0 ? (
        <EmptyState icon={<Database />} title="Nenhum export" description="Gere seu primeiro dataset acima." />
      ) : (
        <div className="space-y-2">
          {exports.map((e) => (
            <Card key={e.id} className="bg-card/40 border-border/40">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={statusVariants[e.status]}>{e.status}</Badge>
                    <span className="text-sm font-medium">{e.dataset}</span>
                    <Badge variant="outline" className="text-[10px]">{e.format.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {e.row_count ?? 0} linhas · {bytesToKB(e.size_bytes)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {safeFormatDistanceToNow(e.created_at, { locale: ptBR, addSuffix: true })}
                    {e.error_message ? ` · ${e.error_message}` : ''}
                  </div>
                </div>
                {e.status === 'completed' && e.file_path && (
                  <Button size="sm" variant="outline" onClick={() => downloadExport(e.file_path!)}>
                    <Download className="h-4 w-4 mr-1" /> Baixar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </NeonPageLayout>
  );
}
