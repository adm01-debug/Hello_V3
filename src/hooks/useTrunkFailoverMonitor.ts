import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const log = logger.create('TrunkFailover');

export function useTrunkFailoverMonitor() {
  useEffect(() => {
    const channel = supabase
      .channel('voip-failover-events')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'voip_trunks',
          filter: 'last_failover_at=is.not.null' 
        },
        (payload) => {
          interface TrunkRow {
            name?: string;
            failover_count?: number;
            failover_reason?: string;
          }
          const oldData = payload.old as TrunkRow;
          const newData = payload.new as TrunkRow;

          // Se o failover_count aumentou, houve um failover recente
          if ((newData.failover_count ?? 0) > (oldData.failover_count || 0)) {
            log.warn('Trunk failover event detected', { 
              trunk: newData.name, 
              reason: newData.failover_reason 
            });

            toast.warning('Failover Automático Realizado', {
              description: `O tronco "${newData.name}" apresentou falha. A linha foi alternada para um tronco reserva para manter a estabilidade.`,
              duration: 8000,
              icon: '🔄',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
