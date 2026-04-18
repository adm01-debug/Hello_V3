import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface AuditEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_email: string | null;
  user_role: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Histórico de ações que afetaram um ramal específico.
 * Inclui:
 *  - logs com resource_id = agent_id (ações individuais)
 *  - logs de bulk onde details->agent_ids contém o agent_id
 */
export function useExtensionAuditHistory(agentId: string | null) {
  return useQuery({
    queryKey: ['extension-audit-history', agentId],
    enabled: !!agentId,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<AuditEntry[]> => {
      if (!agentId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, resource_type, resource_id, user_email, user_role, details, created_at')
        .or(`resource_id.eq.${agentId},details->agent_ids.cs.["${agentId}"]`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        logger.error('extension-audit-history', error);
        throw error;
      }
      return (data ?? []) as AuditEntry[];
    },
  });
}
