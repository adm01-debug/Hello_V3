import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('useConsent');

export type ConsentChannel = 'voice' | 'sms' | 'whatsapp' | 'email';
export type ConsentType = 'marketing' | 'transactional' | 'recording' | 'data_processing';

export interface ConsentRecord {
  id: string;
  contact_id: string | null;
  phone: string | null;
  channel: ConsentChannel;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
  source: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface RecordConsentInput {
  contact_id?: string;
  phone?: string;
  channel: ConsentChannel;
  consent_type: ConsentType;
  granted?: boolean;
  source?: string;
  notes?: string;
}

export function useConsent(contactId?: string) {
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['consent-records', contactId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('consent_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (contactId) query = query.eq('contact_id', contactId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ConsentRecord[];
    },
  });

  const recordMutation = useMutation({
    mutationFn: async (input: RecordConsentInput) => {
      const { data, error } = await supabase.functions.invoke('record-consent', { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consent-records'] });
      toast.success('Consentimento registrado');
    },
    onError: (err: Error) => {
      log.error('Falha ao registrar consentimento', err);
      toast.error('Erro ao registrar consentimento', { description: err.message });
    },
  });

  return {
    records,
    isLoading,
    recordConsent: recordMutation.mutate,
    isRecording: recordMutation.isPending,
  };
}
