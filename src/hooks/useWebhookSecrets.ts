import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const WEBHOOK_SECRETS_QUERY_KEY = ['webhook-secrets'] as const;
export const WEBHOOK_SECRET_COLUMNS = 'id,provider,secret_key,created_at,updated_at';
export const WEBHOOK_SECRET_MIN_LENGTH = 16;
export const PROVIDER_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/;

export interface WebhookSecret {
  id: string;
  provider: string;
  secret_key: string;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Provedores lidos pelas edges via `verifyWebhookSignature`.
 * O segredo e o par (header, HMAC-SHA256 em hex sobre o corpo bruto).
 */
export const WEBHOOK_SECRET_CONSUMERS: Record<string, { edge: string; header: string; label: string }> = {
  'generic-provider': {
    edge: 'webhook-handler',
    header: 'x-webhook-signature',
    label: 'Webhooks genéricos de entrada',
  },
  'analyze-call-webhook': {
    edge: 'analyze-call',
    header: 'x-signature',
    label: 'Gatilho de análise de chamada',
  },
};

export function normalizeProvider(value: string): string {
  return (value ?? '').trim().toLowerCase();
}

export function validateProvider(value: string): string | null {
  const normalized = normalizeProvider(value);
  if (!normalized) return 'Informe o provedor';
  if (!PROVIDER_PATTERN.test(normalized)) {
    return 'Use de 3 a 64 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado';
  }
  return null;
}

export function validateSecret(value: string): string | null {
  if (!value) return 'Informe ou gere um segredo';
  if (value.trim().length < WEBHOOK_SECRET_MIN_LENGTH) {
    return `O segredo precisa de ao menos ${WEBHOOK_SECRET_MIN_LENGTH} caracteres`;
  }
  return null;
}

/** Mostra apenas o final do segredo; o valor completo só sai na ação de revelar/copiar. */
export function maskSecret(secret: string | null | undefined): string {
  const value = secret ?? '';
  if (!value) return '';
  if (value.length <= 4) return '••••';
  return `••••••••${value.slice(-4)}`;
}

export function generateWebhookSecret(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function useWebhookSecrets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: WEBHOOK_SECRETS_QUERY_KEY,
    queryFn: async (): Promise<WebhookSecret[]> => {
      const { data, error } = await supabase
        .from('webhook_secrets')
        .select(WEBHOOK_SECRET_COLUMNS)
        .order('provider', { ascending: true });
      if (error) throw error;
      return (data ?? []) as WebhookSecret[];
    },
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { provider: string; secret: string; mode: 'create' | 'rotate' }) => {
      const provider = normalizeProvider(payload.provider);
      const { data, error } = await supabase
        .from('webhook_secrets')
        .upsert(
          { provider, secret_key: payload.secret, updated_at: new Date().toISOString() },
          { onConflict: 'provider' },
        )
        .select(WEBHOOK_SECRET_COLUMNS)
        .single();
      if (error) throw error;
      return { row: data as WebhookSecret, mode: payload.mode };
    },
    onSuccess: ({ row, mode }) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_SECRETS_QUERY_KEY });
      toast.success(
        mode === 'rotate'
          ? `Segredo de ${row.provider} rotacionado`
          : `Segredo de ${row.provider} cadastrado`,
      );
    },
    onError: (error: Error) => {
      logger.error('Erro ao salvar segredo de webhook', error);
      toast.error('Não foi possível salvar o segredo', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_secrets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_SECRETS_QUERY_KEY });
      toast.success('Segredo removido', {
        description: 'As chamadas desse provedor passam a ser recusadas com 401 até um novo segredo ser cadastrado.',
      });
    },
    onError: (error: Error) => {
      logger.error('Erro ao remover segredo de webhook', error);
      toast.error('Não foi possível remover o segredo', { description: error.message });
    },
  });

  return {
    secrets: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    saveSecret: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteSecret: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}