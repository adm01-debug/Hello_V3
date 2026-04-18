import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Json } from '@/integrations/supabase/types';

export type ExtensionBulkAction =
  | 'bulk_assign_trunk'
  | 'bulk_force_offline'
  | 'bulk_export_csv';

interface BulkAuditPayload {
  action: ExtensionBulkAction;
  agentIds: string[];
  details?: Record<string, unknown>;
}

/**
 * Audit centralizado para ações em massa no painel de ramais.
 * Fire-and-forget — falhas são logadas mas não bloqueiam UI.
 */
export function useExtensionAudit() {
  const logBulk = useCallback(async (payload: BulkAuditPayload) => {
    try {
      const details: Record<string, unknown> = {
        agent_ids: payload.agentIds,
        count: payload.agentIds.length,
        ...payload.details,
      };
      const { error } = await supabase.rpc('log_audit_event', {
        p_action: payload.action,
        p_resource_type: 'extension_bulk',
        p_resource_id: undefined,
        p_details: details as Json,
      });
      if (error) logger.error('extension-audit:bulk', error);
    } catch (err) {
      logger.error('extension-audit:bulk:exception', err);
    }
  }, []);

  return { logBulk };
}
