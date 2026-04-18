import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.create('TrunkUsage');

interface TrunkContext {
  trunk_id: string;
  was_failover: boolean;
  failover_reason: string | null;
  original_trunk_id: string | null;
  started_at: string;
}

/**
 * Captura contexto do trunk no início da chamada e persiste métricas no fim.
 * Não-invasivo: silenciosamente ignora se trunk_id não vier (ex.: secrets legados).
 */
export function useTrunkUsageReporter() {
  const ctxRef = useRef<TrunkContext | null>(null);

  const startTracking = useCallback((sipConfigResp: Record<string, unknown> | null | undefined) => {
    if (!sipConfigResp || !sipConfigResp.trunk_id) {
      ctxRef.current = null;
      return;
    }
    ctxRef.current = {
      trunk_id: sipConfigResp.trunk_id as string,
      was_failover: Boolean(sipConfigResp.failover),
      failover_reason: (sipConfigResp.failover_reason as string) ?? null,
      original_trunk_id: (sipConfigResp.original_trunk_id as string) ?? null,
      started_at: new Date().toISOString(),
    };
  }, []);

  const endTracking = useCallback(async (callSessionId: string | null) => {
    const ctx = ctxRef.current;
    ctxRef.current = null;
    if (!ctx) return;

    try {
      const { error } = await supabase.rpc('record_trunk_usage', {
        p_trunk_id: ctx.trunk_id,
        p_call_session_id: callSessionId,
        p_started_at: ctx.started_at,
        p_ended_at: new Date().toISOString(),
        p_was_failover: ctx.was_failover,
        p_failover_reason: ctx.failover_reason,
        p_original_trunk_id: ctx.original_trunk_id,
      });
      if (error) throw error;
    } catch (err) {
      log.warn('Falha ao registrar uso de trunk', err);
    }
  }, []);

  return { startTracking, endTracking };
}
