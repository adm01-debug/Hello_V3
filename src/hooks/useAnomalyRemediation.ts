import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { AnomalyKind, AnomalyMetric } from './useVoipAnomalies';

const log = logger.create('useAnomalyRemediation');

export interface RemediationPlan {
  action_type: string;
  category: 'codec' | 'campaign' | 'alert' | 'noop';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  destructive: boolean;
}

interface RemediationResponse {
  applied: boolean;
  dryRun?: boolean;
  reason?: string;
  action_id?: string;
  applied_at?: string;
  existing_action_id?: string;
  plan: RemediationPlan;
  request_id: string;
}

interface RemediationInput {
  anomalyId: string;
  metric: AnomalyMetric;
  kind: AnomalyKind;
  dryRun?: boolean;
  notes?: string;
  silent?: boolean;
}

export function useAnomalyRemediation() {
  return useMutation({
    mutationFn: async ({ silent: _silent, ...payload }: RemediationInput): Promise<RemediationResponse> => {
      const { data, error } = await supabase.functions.invoke<RemediationResponse>(
        'voip-anomaly-remediation',
        { body: payload },
      );
      if (error) throw error;
      if (!data) throw new Error('Resposta vazia da remediação');
      return data;
    },
    onSuccess: (data, vars) => {
      if (vars.silent) return;
      if (data.applied) {
        toast.success('Remediação aplicada', { description: data.plan.description });
      } else if (data.reason === 'idempotent_skip') {
        toast.info('Remediação já aplicada recentemente', {
          description: 'Próxima ação permitida em até 1h.',
        });
      } else if (data.dryRun) {
        toast.info('Simulação (dry-run)', { description: data.plan.description });
      } else {
        toast.warning('Sem ação automática mapeada', { description: data.plan.description });
      }
    },
    onError: (err) => {
      log.error('Falha ao aplicar remediação', err);
      toast.error('Falha ao aplicar remediação automática');
    },
  });
}
