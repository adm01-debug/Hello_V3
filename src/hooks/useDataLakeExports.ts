import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ExportDataset = 'call_sessions' | 'deals' | 'contacts' | 'audit_logs';
export type ExportFormat = 'csv' | 'ndjson' | 'parquet';

export interface DataLakeExport {
  id: string;
  requested_by: string;
  dataset: ExportDataset;
  format: ExportFormat;
  since_date: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path: string | null;
  row_count: number | null;
  size_bytes: number | null;
  error_message: string | null;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
}

export function useDataLakeExports() {
  return useQuery<DataLakeExport[]>({
    queryKey: ['data-lake-exports'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('data_lake_exports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as DataLakeExport[];
    },
    refetchInterval: (q) => {
      const rows = q.state.data as DataLakeExport[] | undefined;
      return rows?.some((r) => r.status === 'processing' || r.status === 'pending') ? 3000 : false;
    },
  });
}

export function useCreateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { dataset: ExportDataset; format: ExportFormat; since?: string }) => {
      const { data, error } = await supabase.functions.invoke('export-data-lake', { body: input });
      if (error) throw error;
      return data as { export_id: string; rows: number; file_path: string };
    },
    onSuccess: (d) => {
      toast.success(`Export gerado: ${d.rows} linhas`);
      qc.invalidateQueries({ queryKey: ['data-lake-exports'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Falha ao exportar'),
  });
}

export async function downloadExport(filePath: string): Promise<void> {
  const { data, error } = await supabase.storage.from('data-lake-exports').createSignedUrl(filePath, 60 * 15);
  if (error || !data) {
    toast.error('Falha ao gerar link de download');
    return;
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}
