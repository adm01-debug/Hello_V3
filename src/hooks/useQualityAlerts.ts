import { useEffect } from 'react';
import { useQualityMetrics } from './useQualityMetrics';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useQualityAlerts() {
  const { data: quality = [] } = useQualityMetrics();

  useEffect(() => {
    if (quality.length === 0) return;

    const latest = quality[0];
    if (latest.quality_label === 'poor' || latest.mos_avg < 3.0) {
      const logMsg = `Qualidade crítica detectada: MOS ${latest.mos_avg} para agente ${latest.agent_name}`;
      logger.error(logMsg);
      
      toast.error('Qualidade de Chamada Crítica', {
        description: `${latest.agent_name} está com MOS ${latest.mos_avg}. Verifique a rede.`,
        duration: 8000,
      });
    }
  }, [quality]);
}
