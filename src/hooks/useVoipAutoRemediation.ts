import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.create('VoipAutoRemediation');

interface RemediationActions {
  /** Reconecta o stack SIP do zero. */
  reconnect: () => Promise<void> | void;
  /** Encerra chamada (fallback drástico). */
  endCall: () => void;
}

/**
 * Sugere ações concretas ao detectar degradação severa de qualidade VoIP.
 * Nunca executa ação automática — usuário sempre confirma via toast action.
 */
export function useVoipAutoRemediation(actions: RemediationActions) {
  const lastSuggestedRef = useRef<number>(0);

  const suggest = useCallback(
    (info: { mos: number; slope: number }) => {
      const now = Date.now();
      // Throttle: não sugere mais de uma vez a cada 30s
      if (now - lastSuggestedRef.current < 30_000) return;
      lastSuggestedRef.current = now;

      log.warn('Sugerindo auto-remediação', info);
      toast.error('Qualidade crítica detectada', {
        description: `MOS ${info.mos.toFixed(2)} — reconectar o SIP pode restaurar a chamada.`,
        duration: 12_000,
        action: {
          label: 'Reconectar SIP',
          onClick: async () => {
            try {
              await actions.reconnect();
              toast.success('Reconexão iniciada');
            } catch (e) {
              log.error('Falha ao reconectar', e);
              toast.error('Não foi possível reconectar');
            }
          },
        },
        cancel: {
          label: 'Encerrar',
          onClick: () => {
            actions.endCall();
            toast.info('Chamada encerrada');
          },
        },
      });
    },
    [actions],
  );

  return { suggest };
}
