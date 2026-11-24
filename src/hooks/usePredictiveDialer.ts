import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  apiAddToQueue,
  apiCreateCampaign,
  apiDeleteCampaign,
  apiFetchCampaigns,
  apiFetchQueue,
  apiGetNextContact,
  apiMarkDialing,
  apiMarkSkipped,
  apiPauseCampaign,
  apiRemoveFromQueue,
  apiStartCampaign,
  apiUpdateCampaignStats,
  apiUpdateCampaignTotal,
  apiUpdateQueueItem,
} from './predictive-dialer/api';
import type {
  AddToQueueInput,
  CallResult,
  CreateCampaignInput,
  DialerCampaign,
  DialerQueueItem,
} from './predictive-dialer/types';

export type {
  AddToQueueInput,
  CreateCampaignInput,
  DialerCampaign,
  DialerQueueItem,
} from './predictive-dialer/types';

const log = logger.create('PredictiveDialer');

/**
 * Checagem de DNC/horario legal antes de discar. Estruturalmente igual ao
 * `preDialCheck` de `useDNCCompliance`, declarado aqui para o discador nao
 * depender do hook de chamadas.
 */
export type PreDialCheck = (
  phone: string,
  regionCode?: string,
) => Promise<{ canDial: boolean; reasons: string[] }>;

export const usePredictiveDialer = (preDialCheck?: PreDialCheck) => {
  const [campaigns, setCampaigns] = useState<DialerCampaign[]>([]);
  const [queue, setQueue] = useState<DialerQueueItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DialerCampaign | null>(null);
  const [isDialing, setIsDialing] = useState(false);
  const [currentCall, setCurrentCall] = useState<DialerQueueItem | null>(null);
  // Incrementado quando um contato e pulado, para o laco automatico buscar o
  // proximo em vez de ficar parado esperando currentCall mudar.
  const [loopTick, setLoopTick] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dialerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      setCampaigns(await apiFetchCampaigns());
    } catch (err) {
      log.error('Error fetching campaigns:', err);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchQueue = useCallback(async (campaignId: string) => {
    try {
      const data = await apiFetchQueue(campaignId);
      setQueue(data);
      return data;
    } catch (err) {
      log.error('Error fetching queue:', err);
      return [];
    }
  }, []);

  const createCampaign = useCallback(
    async (input: CreateCampaignInput): Promise<DialerCampaign | null> => {
      try {
        const data = await apiCreateCampaign(input);
        toast.success('Campanha criada com sucesso');
        await fetchCampaigns();
        return data;
      } catch (err) {
        log.error('Error creating campaign:', err);
        toast.error('Erro ao criar campanha');
        return null;
      }
    },
    [fetchCampaigns],
  );

  const addToQueue = useCallback(
    async (items: AddToQueueInput[]): Promise<boolean> => {
      try {
        await apiAddToQueue(items);
        const campaignId = items[0].campaign_id;
        const currentTotal = campaigns.find((c) => c.id === campaignId)?.total_contacts || 0;
        await apiUpdateCampaignTotal(campaignId, currentTotal + items.length);
        toast.success(`${items.length} contato(s) adicionado(s) à fila`);
        await fetchQueue(campaignId);
        return true;
      } catch (err) {
        log.error('Error adding to queue:', err);
        toast.error('Erro ao adicionar à fila');
        return false;
      }
    },
    [campaigns, fetchQueue],
  );

  const startCampaign = useCallback(
    async (campaignId: string) => {
      try {
        const data = await apiStartCampaign(campaignId);
        setActiveCampaign(data);
        setIsDialing(true);
        toast.success('Campanha iniciada');
        await fetchCampaigns();
      } catch (err) {
        log.error('Error starting campaign:', err);
        toast.error('Erro ao iniciar campanha');
      }
    },
    [fetchCampaigns],
  );

  const pauseCampaign = useCallback(
    async (campaignId: string) => {
      try {
        await apiPauseCampaign(campaignId);
        setIsDialing(false);
        setActiveCampaign(null);
        toast.info('Campanha pausada');
        await fetchCampaigns();
      } catch (err) {
        log.error('Error pausing campaign:', err);
        toast.error('Erro ao pausar campanha');
      }
    },
    [fetchCampaigns],
  );

  const getNextContact = useCallback(async (campaignId: string) => {
    try {
      return await apiGetNextContact(campaignId);
    } catch (err) {
      log.error('Error getting next contact:', err);
      return null;
    }
  }, []);

  const dialContact = useCallback(async (queueItem: DialerQueueItem): Promise<void> => {
    // Barreira de compliance: o discador tambem e caminho de discagem, entao
    // passa pela mesma checagem do softphone antes de marcar como `dialing`.
    if (preDialCheck) {
      try {
        const { canDial, reasons } = await preDialCheck(queueItem.phone);
        if (!canDial) {
          const motivo = reasons.join(' · ') || 'bloqueado pela checagem de DNC/horario';
          await apiMarkSkipped(queueItem, motivo);
          log.warn(`Contato pulado por compliance: ${queueItem.phone} — ${motivo}`);
          toast.warning(`Contato ${queueItem.name || queueItem.phone} pulado`, {
            description: motivo,
          });
          // Re-arma o laco automatico: sem isto a campanha pararia no primeiro pulo.
          setLoopTick((tick) => tick + 1);
          return;
        }
      } catch (err) {
        // Fail-open ate a etapa 035, que torna a checagem fail-closed no banco.
        log.error('preDialCheck falhou; seguindo com a discagem', err);
      }
    }

    try {
      await apiMarkDialing(queueItem);
      setCurrentCall(queueItem);
      toast.info(`Discando para ${queueItem.name || queueItem.phone}...`, {
        description: queueItem.phone,
      });
    } catch (err) {
      // Um claim que falhou deixa a linha em estado desconhecido: seguir
      // discando poderia duplicar a ligacao. Para a campanha (etapa 080).
      log.error('Error dialing contact:', err);
      setIsDialing(false);
      setActiveCampaign(null);
      toast.error('Não foi possível reservar o contato na fila. Campanha pausada.', {
        description: 'A fila pode estar inconsistente. Retome quando o erro cessar.',
      });
    }
  }, [preDialCheck]);

  const completeCall = useCallback(
    async (
      queueItemId: string,
      result: CallResult,
      notes?: string,
      duration?: number,
    ): Promise<void> => {
      try {
        const queueItem = queue.find((q) => q.id === queueItemId);
        if (!queueItem) return;
        const campaign =
          activeCampaign || campaigns.find((c) => c.id === queueItem.campaign_id);
        if (!campaign) return;

        let newStatus = 'completed';
        let nextAttempt: string | null = null;
        if (
          (result === 'no_answer' || result === 'busy') &&
          queueItem.attempts < campaign.retry_attempts
        ) {
          newStatus = 'pending';
          nextAttempt = new Date(
            Date.now() + campaign.retry_delay_minutes * 60 * 1000,
          ).toISOString();
        } else if (result === 'callback') {
          newStatus = 'pending';
          nextAttempt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        }

        await apiUpdateQueueItem(queueItemId, {
          status: newStatus,
          result,
          result_notes: notes ?? null,
          call_duration_seconds: duration ?? null,
          next_attempt_at: nextAttempt,
        });

        if (newStatus === 'completed') {
          const isSuccessful = result === 'answered';
          await apiUpdateCampaignStats(
            campaign.id,
            (campaign.completed_contacts || 0) + 1,
            isSuccessful
              ? (campaign.successful_contacts || 0) + 1
              : campaign.successful_contacts,
          );
        }

        setCurrentCall(null);
        await fetchCampaigns();
        if (activeCampaign) await fetchQueue(activeCampaign.id);
      } catch (err) {
        log.error('Error completing call:', err);
      }
    },
    [queue, activeCampaign, campaigns, fetchCampaigns, fetchQueue],
  );

  const deleteCampaign = useCallback(
    async (campaignId: string): Promise<boolean> => {
      try {
        await apiDeleteCampaign(campaignId);
        toast.success('Campanha removida');
        await fetchCampaigns();
        return true;
      } catch (err) {
        log.error('Error deleting campaign:', err);
        toast.error('Erro ao remover campanha');
        return false;
      }
    },
    [fetchCampaigns],
  );

  const removeFromQueue = useCallback(async (queueItemId: string): Promise<boolean> => {
    try {
      await apiRemoveFromQueue(queueItemId);
      setQueue((prev) => prev.filter((q) => q.id !== queueItemId));
      return true;
    } catch (err) {
      log.error('Error removing from queue:', err);
      return false;
    }
  }, []);

  // "Priorizar" e so mudar `priority`: a fila e a escolha do proximo contato
  // (apiFetchQueue e apiGetNextContact) ordenam por priority desc.
  const setPriority = useCallback(async (queueItemId: string, priority: number): Promise<boolean> => {
    try {
      await apiUpdateQueueItem(queueItemId, { priority });
      setQueue((prev) => prev.map((q) => (q.id === queueItemId ? { ...q, priority } : q)));
      return true;
    } catch (err) {
      log.error('Error setting priority:', err);
      return false;
    }
  }, []);

  // Auto-dial loop
  useEffect(() => {
    if (isDialing && activeCampaign && !currentCall) {
      const dial = async () => {
        const next = await getNextContact(activeCampaign.id);
        if (next) {
          await dialContact(next);
        } else {
          toast.info('Fila de discagem concluída');
          await pauseCampaign(activeCampaign.id);
        }
      };
      dialerIntervalRef.current = setTimeout(dial, 2000);
    }
    return () => {
      if (dialerIntervalRef.current) clearTimeout(dialerIntervalRef.current);
    };
  }, [isDialing, activeCampaign, currentCall, loopTick, getNextContact, dialContact, pauseCampaign]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('dialer-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dialer_campaigns' },
        () => fetchCampaigns(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dialer_queue' },
        () => {
          if (activeCampaign) fetchQueue(activeCampaign.id);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCampaigns, fetchQueue, activeCampaign]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    queue,
    activeCampaign,
    isDialing,
    currentCall,
    isLoading,
    fetchCampaigns,
    fetchQueue,
    createCampaign,
    addToQueue,
    startCampaign,
    pauseCampaign,
    dialContact,
    completeCall,
    deleteCampaign,
    removeFromQueue,
    setPriority,
    setActiveCampaign,
  };
};
