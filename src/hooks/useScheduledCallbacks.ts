import { logger } from '@/lib/logger';
const log = logger.create('ScheduledCallbacks');
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduledCallback {
  id: string;
  contact_id: string | null;
  caller_name: string;
  caller_phone: string;
  scheduled_at: string;
  notes: string | null;
  status: string;
  priority: string;
  assigned_agent: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCallbackInput {
  contact_id?: string | null;
  caller_name: string;
  caller_phone: string;
  scheduled_at: string;
  notes?: string;
  priority?: string;
  assigned_agent?: string;
  created_by?: string;
}

export const useScheduledCallbacks = () => {
  const [callbacks, setCallbacks] = useState<ScheduledCallback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);

  const fetchCallbacks = useCallback(async (status?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('scheduled_callbacks')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCallbacks((data || []) as ScheduledCallback[]);
      return data as ScheduledCallback[];
    } catch (err) {
      log.error('Error fetching callbacks:', err);
      toast.error('Erro ao carregar callbacks');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUpcomingCount = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const nextHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('scheduled_callbacks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('scheduled_at', now)
        .lte('scheduled_at', nextHour);

      if (!error && count !== null) {
        setUpcomingCount(count);
      }
    } catch (err) {
      log.error('Error fetching upcoming count:', err);
    }
  }, []);

  const createCallback = useCallback(async (input: CreateCallbackInput): Promise<ScheduledCallback | null> => {
    try {
      const { data, error } = await supabase
        .from('scheduled_callbacks')
        .insert({
          contact_id: input.contact_id || null,
          caller_name: input.caller_name,
          caller_phone: input.caller_phone,
          scheduled_at: input.scheduled_at,
          notes: input.notes,
          priority: input.priority || 'normal',
          assigned_agent: input.assigned_agent,
          created_by: input.created_by,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Callback agendado com sucesso');
      await fetchCallbacks('pending');
      return data as ScheduledCallback;
    } catch (err) {
      log.error('Error creating callback:', err);
      toast.error('Erro ao agendar callback');
      return null;
    }
  }, [fetchCallbacks]);

  const updateCallback = useCallback(async (
    id: string, 
    updates: Partial<CreateCallbackInput & { status: string; completed_at: string | null }>
  ): Promise<ScheduledCallback | null> => {
    try {
      const { data, error } = await supabase
        .from('scheduled_callbacks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Callback atualizado');
      await fetchCallbacks('pending');
      return data as ScheduledCallback;
    } catch (err) {
      log.error('Error updating callback:', err);
      toast.error('Erro ao atualizar callback');
      return null;
    }
  }, [fetchCallbacks]);

  const completeCallback = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_callbacks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Callback marcado como concluído');
      await fetchCallbacks('pending');
      return true;
    } catch (err) {
      log.error('Error completing callback:', err);
      toast.error('Erro ao concluir callback');
      return false;
    }
  }, [fetchCallbacks]);

  const cancelCallback = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_callbacks')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Callback cancelado');
      await fetchCallbacks('pending');
      return true;
    } catch (err) {
      log.error('Error cancelling callback:', err);
      toast.error('Erro ao cancelar callback');
      return false;
    }
  }, [fetchCallbacks]);

  const deleteCallback = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_callbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Callback removido');
      await fetchCallbacks('pending');
      return true;
    } catch (err) {
      log.error('Error deleting callback:', err);
      toast.error('Erro ao remover callback');
      return false;
    }
  }, [fetchCallbacks]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('scheduled-callbacks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_callbacks'
        },
        () => {
          fetchCallbacks('pending');
          fetchUpcomingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCallbacks, fetchUpcomingCount]);

  // Load pending callbacks on mount
  useEffect(() => {
    fetchCallbacks('pending');
    fetchUpcomingCount();
  }, [fetchCallbacks, fetchUpcomingCount]);

  return {
    callbacks,
    isLoading,
    upcomingCount,
    fetchCallbacks,
    fetchUpcomingCount,
    createCallback,
    updateCallback,
    completeCallback,
    cancelCallback,
    deleteCallback
  };
};
