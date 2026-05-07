import { logger } from '@/lib/logger';
const log = logger.create('PredictiveDialer');
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DialerCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  mode: string;
  max_concurrent_calls: number;
  call_timeout_seconds: number;
  retry_attempts: number;
  retry_delay_minutes: number;
  working_hours_start: string | null;
  working_hours_end: string | null;
  total_contacts: number;
  completed_contacts: number;
  successful_contacts: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DialerQueueItem {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  phone: string;
  name: string | null;
  priority: number;
  status: string;
  attempts: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  result: string | null;
  result_notes: string | null;
  assigned_agent: string | null;
  call_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  mode?: string;
  max_concurrent_calls?: number;
  call_timeout_seconds?: number;
  retry_attempts?: number;
  retry_delay_minutes?: number;
  working_hours_start?: string;
   working_hours_end?: string;
   created_by?: string;
   status?: string;
 }

export interface AddToQueueInput {
  campaign_id: string;
  phone: string;
  name?: string;
  contact_id?: string;
  priority?: number;
}

export const usePredictiveDialer = () => {
  const [campaigns, setCampaigns] = useState<DialerCampaign[]>([]);
  const [queue, setQueue] = useState<DialerQueueItem[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DialerCampaign | null>(null);
  const [isDialing, setIsDialing] = useState(false);
  const [currentCall, setCurrentCall] = useState<DialerQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dialerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch all campaigns
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dialer_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as DialerCampaign[]);
    } catch (err) {
      log.error('Error fetching campaigns:', err);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch queue for a campaign
  const fetchQueue = useCallback(async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('dialer_queue')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQueue((data || []) as DialerQueueItem[]);
      return data as DialerQueueItem[];
    } catch (err) {
      log.error('Error fetching queue:', err);
      return [];
    }
  }, []);

  // Create a new campaign
  const createCampaign = useCallback(async (input: CreateCampaignInput): Promise<DialerCampaign | null> => {
    try {
      const { data, error } = await supabase
        .from('dialer_campaigns')
        .insert({
          name: input.name,
          description: input.description,
          mode: input.mode || 'predictive',
          max_concurrent_calls: input.max_concurrent_calls || 3,
          call_timeout_seconds: input.call_timeout_seconds || 30,
          retry_attempts: input.retry_attempts || 2,
          retry_delay_minutes: input.retry_delay_minutes || 30,
          working_hours_start: input.working_hours_start || '08:00:00',
           working_hours_end: input.working_hours_end || '18:00:00',
           created_by: input.created_by,
           status: input.status || 'paused'
         })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Campanha criada com sucesso');
      await fetchCampaigns();
      return data as DialerCampaign;
    } catch (err) {
      log.error('Error creating campaign:', err);
      toast.error('Erro ao criar campanha');
      return null;
    }
  }, [fetchCampaigns]);

  // Add contacts to queue
  const addToQueue = useCallback(async (items: AddToQueueInput[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dialer_queue')
        .insert(items.map(item => ({
          campaign_id: item.campaign_id,
          phone: item.phone,
          name: item.name,
          contact_id: item.contact_id || null,
          priority: item.priority || 0,
          status: 'pending'
        })));

      if (error) throw error;

      // Update campaign total
      const campaignId = items[0].campaign_id;
      const currentTotal = campaigns.find(c => c.id === campaignId)?.total_contacts || 0;
      await supabase
        .from('dialer_campaigns')
        .update({ 
          total_contacts: currentTotal + items.length 
        })
        .eq('id', campaignId);

      toast.success(`${items.length} contato(s) adicionado(s) à fila`);
      await fetchQueue(campaignId);
      return true;
    } catch (err) {
      log.error('Error adding to queue:', err);
      toast.error('Erro ao adicionar à fila');
      return false;
    }
  }, [campaigns, fetchQueue]);

  // Start dialing campaign
  const startCampaign = useCallback(async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('dialer_campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;

      setActiveCampaign(data as DialerCampaign);
      setIsDialing(true);
      toast.success('Campanha iniciada');
      await fetchCampaigns();
    } catch (err) {
      log.error('Error starting campaign:', err);
      toast.error('Erro ao iniciar campanha');
    }
  }, [fetchCampaigns]);

  // Pause campaign
  const pauseCampaign = useCallback(async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('dialer_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId);

      if (error) throw error;

      setIsDialing(false);
      setActiveCampaign(null);
      toast.info('Campanha pausada');
      await fetchCampaigns();
    } catch (err) {
      log.error('Error pausing campaign:', err);
      toast.error('Erro ao pausar campanha');
    }
  }, [fetchCampaigns]);

  // Get next contact to dial
  const getNextContact = useCallback(async (campaignId: string): Promise<DialerQueueItem | null> => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('dialer_queue')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DialerQueueItem | null;
    } catch (err) {
      log.error('Error getting next contact:', err);
      return null;
    }
  }, []);

  // Dial a contact
  const dialContact = useCallback(async (queueItem: DialerQueueItem): Promise<void> => {
    try {
      // Mark as dialing
      await supabase
        .from('dialer_queue')
        .update({ 
          status: 'dialing',
          last_attempt_at: new Date().toISOString(),
          attempts: queueItem.attempts + 1
        })
        .eq('id', queueItem.id);

      setCurrentCall(queueItem);
      
      // Simulate dial (in real implementation, this would connect to actual VoIP system)
      toast.info(`Discando para ${queueItem.name || queueItem.phone}...`, {
        description: queueItem.phone
      });

    } catch (err) {
      log.error('Error dialing contact:', err);
    }
  }, []);

  // Complete a call
  const completeCall = useCallback(async (
    queueItemId: string, 
    result: 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback',
    notes?: string,
    duration?: number
  ): Promise<void> => {
    try {
      const queueItem = queue.find(q => q.id === queueItemId);
      if (!queueItem) return;

      const campaign = activeCampaign || campaigns.find(c => c.id === queueItem.campaign_id);
      if (!campaign) return;

      let newStatus = 'completed';
      let nextAttempt: string | null = null;

      // Handle retry logic
      if ((result === 'no_answer' || result === 'busy') && queueItem.attempts < campaign.retry_attempts) {
        newStatus = 'pending';
        nextAttempt = new Date(Date.now() + campaign.retry_delay_minutes * 60 * 1000).toISOString();
      } else if (result === 'callback') {
        newStatus = 'pending';
        nextAttempt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      }

      await supabase
        .from('dialer_queue')
        .update({ 
          status: newStatus,
          result,
          result_notes: notes,
          call_duration_seconds: duration,
          next_attempt_at: nextAttempt
        })
        .eq('id', queueItemId);

      // Update campaign stats
      const isCompleted = newStatus === 'completed';
      const isSuccessful = result === 'answered';

      if (campaign && isCompleted) {
        await supabase
          .from('dialer_campaigns')
          .update({ 
            completed_contacts: (campaign.completed_contacts || 0) + 1,
            successful_contacts: isSuccessful ? (campaign.successful_contacts || 0) + 1 : campaign.successful_contacts
          })
          .eq('id', campaign.id);
      }

      setCurrentCall(null);
      
      if (activeCampaign) {
        await fetchQueue(activeCampaign.id);
      }
    } catch (err) {
      log.error('Error completing call:', err);
    }
  }, [queue, activeCampaign, campaigns, fetchQueue]);

  // Delete campaign
  const deleteCampaign = useCallback(async (campaignId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dialer_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      
      toast.success('Campanha removida');
      await fetchCampaigns();
      return true;
    } catch (err) {
      log.error('Error deleting campaign:', err);
      toast.error('Erro ao remover campanha');
      return false;
    }
  }, [fetchCampaigns]);

  // Remove from queue
  const removeFromQueue = useCallback(async (queueItemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dialer_queue')
        .delete()
        .eq('id', queueItemId);

      if (error) throw error;
      
      setQueue(prev => prev.filter(q => q.id !== queueItemId));
      return true;
    } catch (err) {
      log.error('Error removing from queue:', err);
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
          // No more contacts to dial
          toast.info('Fila de discagem concluída');
          await pauseCampaign(activeCampaign.id);
        }
      };

      dialerIntervalRef.current = setTimeout(dial, 2000);
    }

    return () => {
      if (dialerIntervalRef.current) {
        clearTimeout(dialerIntervalRef.current);
      }
    };
  }, [isDialing, activeCampaign, currentCall, getNextContact, dialContact, pauseCampaign]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('dialer-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dialer_campaigns' },
        () => fetchCampaigns()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dialer_queue' },
        () => {
          if (activeCampaign) {
            fetchQueue(activeCampaign.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCampaigns, fetchQueue, activeCampaign]);

  // Load campaigns on mount
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
    setActiveCampaign
  };
};
