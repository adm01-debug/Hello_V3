import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useVirtualFaxOcr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (faxId: string) => {
      const { data, error } = await supabase.functions.invoke('ocr-virtual-fax', { body: { fax_id: faxId } });
      if (error) throw error;
      return data as { fax_id: string; chars: number };
    },
    onSuccess: (d) => {
      toast.success(`OCR concluído: ${d.chars} caracteres`);
      qc.invalidateQueries({ queryKey: ['virtual-fax'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Falha no OCR'),
  });
}
