import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { InitiateCallOptions } from '@/hooks/useMultiChannelCall';
import { useSipCall } from '@/hooks/useSipCall';
import { useCallContext } from '@/contexts/CallContext';
import {
  apiAddToQueue,
  apiClaimNextContact,
  apiCreateCampaign,
  apiDeleteCampaign,
  apiFetchCampaigns,
  apiFetchQueue,
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

// E244: realtime sem agrupamento dispara uma leitura por evento. Uma rajada
// (varias linhas da mesma tabela chegando juntas) vira uma leitura so.
const agendarLeitura = (
  alvo: { current: ReturnType<typeof setTimeout> | null },
  ler: () => void,
) => {
  if (alvo.current) clearTimeout(alvo.current);
  alvo.current = setTimeout(() => { alvo.current = null; ler(); }, 1_000);
};

/**
 * Checagem de DNC/horario legal antes de discar. Estruturalmente igual ao
 * `preDialCheck` de `useDNCCompliance`, declarado aqui para o discador nao
 * depender do hook de chamadas.
 */
export type PreDialCheck = (
  phone: string,
  regionCode?: string,
) => Promise<{ canDial: boolean; reasons: string[] }>;

/**
 * Etapa 078: a telefonia e injetada. O discador decide *quem* ligar; quem
 * disca de verdade e o `initiateCall` de `useMultiChannelCall` (o mesmo que o
 * softphone usa). Injetar em vez de montar o hook aqui evita uma segunda pilha
 * de chamadas no mesmo navegador e mantem os testes sem SIP/Wavoip reais.
 * Devolve `null` quando a discagem foi bloqueada (compliance, limite de
 * simultaneas) — nesse caso o contato volta para a fila.
 */
export type DialCall = (
  phone: string,
  contactName?: string | null,
  options?: InitiateCallOptions,
) => Promise<{ id: string } | null>;

export const usePredictiveDialer = (preDialCheck?: PreDialCheck, dialCall?: DialCall) => {
  const [campaigns, setCampaigns] = useState<DialerCampaign[]>([]);
  const [queue, setQueue] = useState<DialerQueueItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DialerCampaign | null>(null);
  const [isDialing, setIsDialing] = useState(false);
  const [currentCall, setCurrentCall] = useState<DialerQueueItem | null>(null);
  // Id da chamada de telefonia em curso (etapa 078). Fica fora de
  // `DialerQueueItem` para nao misturar a linha da fila com a chamada.
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [loopTick, setLoopTick] = useState(0);
  // Incrementado quando um contato e pulado, para o laco automatico buscar o
  // proximo em vez de ficar parado esperando currentCall mudar.
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

  // Etapa 078: o contato ja foi reservado no banco como `dialing`. Quando a
  // discagem nao acontece, a linha precisa voltar para `pending` — senao o
  // laco automatico nunca mais a pega.
  const devolverParaFila = useCallback(async (queueItem: DialerQueueItem, motivo: string) => {
    try {
      await apiUpdateQueueItem(queueItem.id, { status: 'pending' });
    } catch (err) {
      log.error('Falha ao devolver o contato para a fila:', err);
    }
    log.warn(`Discagem não iniciada para ${queueItem.phone}: ${motivo}`);
    toast.warning(`Discagem não iniciada para ${queueItem.name || queueItem.phone}`, {
      description: `${motivo}. O contato voltou para a fila.`,
    });
    setLoopTick((tick) => tick + 1);
  }, [setLoopTick]);

  // Discagem SIP real do discador: a sessao multicanal (compliance, limite e
  // estado da tela de chamada) e o startCall do JsSIP, o mesmo par que o
  // PhoneDialer usa. Se o PABX recusar, a sessao e encerrada e o contato volta
  // para a fila em vez de ficar em `dialing`.
  const sip = useSipCall();
  const call = useCallContext();
  const dialSip = useCallback(async (
    phone: string,
    contactName?: string | null,
  ): Promise<{ id: string } | null> => {
    const sessao = await call.initiateCall('sip', phone, contactName ?? undefined);
    if (!sessao) return null;
    call.updateCallStatus('ringing', sessao.id);
    const ok = await sip.startCall(phone);
    if (!ok) {
      call.endCall(sessao.id);
      return null;
    }
    return { id: sessao.id };
  }, [call, sip]);
  const dial = useMemo<DialCall>(() => dialCall ?? dialSip, [dialCall, dialSip]);

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
        // Etapa 035: fail-closed. Antes a campanha seguia marcando `dialing`
        // quando a checagem falhava -- numero da DNC entrava na fila discado
        // sem qualquer rastro. Agora sai como `skipped` com o motivo.
        const motivo = `verificação de conformidade indisponível: ${err instanceof Error ? err.message : String(err)}`;
        await apiMarkSkipped(queueItem, motivo);
        log.error('preDialCheck falhou; contato pulado', err);
        toast.warning(`Contato ${queueItem.name || queueItem.phone} pulado`, {
          description: motivo,
        });
        setLoopTick((tick) => tick + 1);
        return;
      }
    }

    let iniciada: { id: string } | null = null;
    try {
      iniciada = await dial(
        queueItem.phone,
        queueItem.name,
        // Etapa 078: quem ja checou DNC/horario foi o bloco acima, pelo
        // `preDialCheck` injetado — repetir abriria uma janela entre as duas
        // checagens.
        { skipComplianceCheck: true },
      );
    } catch (err) {
      // Etapa 078: falha ao discar nao pode deixar o contato preso em
      // `dialing` — sem isto a fila pararia nele para sempre.
      log.error('Erro ao discar o contato reservado:', err);
      await devolverParaFila(queueItem, 'falha ao discar');
      return;
    }

    if (!iniciada) {
      await devolverParaFila(
        queueItem,
        'não foi possível iniciar a chamada (linha ocupada ou telefonia indisponível)',
      );
      return;
    }

    setCurrentCall(queueItem);
    setActiveCallId(iniciada.id);
    toast.info(`Discando para ${queueItem.name || queueItem.phone}...`, {
      description: queueItem.phone,
    });
  }, [preDialCheck, devolverParaFila, dial]);

  // Encerra a chamada de telefonia do contato em curso (etapa 078). Sem isto o
  // operador registrava o desfecho e a linha seguia ocupada, contando no limite
  // de simultaneas e travando a proxima discagem.
  // `finalizar` devolve o contato para a fila (pausa no meio); ao registrar o
  // desfecho (`completeCall`) o contato ja tem destino, so a linha e liberada.
  const endActiveCall = useCallback((finalizar = false) => {
    if (activeCallId) {
      sip.endCall();
      call.endCall(activeCallId);
    }
    setCurrentCall(null);
    setActiveCallId(null);
    // A fila tem o contato reservado como `dialing`: parar a campanha sem
    // devolve-lo deixaria a linha presa e o contato fora de qualquer lista.
    const contato = finalizar ? null : currentCall;
    if (contato) {
      void apiUpdateQueueItem(contato.id, { status: 'pending' }).catch((err) =>
        log.error('Falha ao devolver o contato para a fila:', err),
      );
    }
  }, [activeCallId, call, sip, currentCall]);

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

        // Etapa 078: registra o desfecho e devolve a linha -- a chamada de
        // telefonia nao termina sozinha quando o operador conclui.
        endActiveCall();
        await fetchCampaigns();
        if (activeCampaign) await fetchQueue(activeCampaign.id);
      } catch (err) {
        log.error('Error completing call:', err);
      }
    },
    [queue, activeCampaign, campaigns, fetchCampaigns, fetchQueue, endActiveCall],
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
  // (apiFetchQueue e claim_next_dialer_contact) ordenam por priority desc.
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
        try {
          // Etapa 079: reserva atomica no banco — devolve o contato ja em
          // `dialing` e so para este chamador.
          const next = await apiClaimNextContact(activeCampaign.id);
          if (next) {
            await dialContact(next);
          } else {
            toast.info('Fila de discagem concluída');
            await pauseCampaign(activeCampaign.id);
          }
        } catch (err) {
          // Etapa 080: sem reserva confiavel nao da para seguir discando — a
          // linha fica em estado desconhecido e o proximo ciclo poderia ligar
          // de novo. Para a campanha.
          log.error('Error claiming next contact:', err);
          setIsDialing(false);
          setActiveCampaign(null);
          toast.error('Não foi possível reservar o contato na fila. Campanha pausada.', {
            description: 'A fila pode estar inconsistente. Retome quando o erro cessar.',
          });
        }
      };
      dialerIntervalRef.current = setTimeout(dial, 2000);
    }
    return () => {
      if (dialerIntervalRef.current) clearTimeout(dialerIntervalRef.current);
    };
  }, [isDialing, activeCampaign, currentCall, loopTick, dialContact, pauseCampaign]);

  // E244: sem agrupamento, cada linha de `dialer_queue`/`dialer_campaigns` que o
  // realtime entregava disparava uma leitura — e o canal era recriado a cada
  // troca de campanha ativa. O agrupamento de 1 s e a campanha em ref resolvem as
  // duas coisas sem mudar o que o operador ve.
  const realtimeDebounceCampanhasRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeDebounceFilaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCampaignRef = useRef<DialerCampaign | null>(activeCampaign);
  useEffect(() => { activeCampaignRef.current = activeCampaign; }, [activeCampaign]);

  useEffect(() => {
    const refCampanhas = realtimeDebounceCampanhasRef;
    const refFila = realtimeDebounceFilaRef;
    const channel = supabase
      .channel('dialer-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dialer_campaigns' },
        () => agendarLeitura(refCampanhas, () => { void fetchCampaigns(); }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dialer_queue' },
        () => agendarLeitura(refFila, () => {
          const campanha = activeCampaignRef.current;
          if (campanha) void fetchQueue(campanha.id);
        }),
      )
      .subscribe();
    return () => {
      if (refCampanhas.current) clearTimeout(refCampanhas.current);
      if (refFila.current) clearTimeout(refFila.current);
      supabase.removeChannel(channel);
    };
  }, [fetchCampaigns, fetchQueue]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    queue,
    activeCampaign,
    isDialing,
    currentCall,
    activeCallId,
    endActiveCall,
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
