// @ts-nocheck
/**
 * Hook para buscar dados reais do Contact Center
 * MIGRAÇÃO: Mock → Produção
 * Substitui: src/data/mockData.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  company?: string;
  favorite: boolean;
  last_call?: string;
  created_at: string;
}

export interface CallRecord {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'completed' | 'missed' | 'voicemail';
  duration: number;
  timestamp: string;
  recording_url?: string;
  notes?: string;
}

export interface QueueItem {
  id: string;
  contact_name: string;
  contact_phone: string;
  wait_time: number;
  priority: number;
  agent_assigned?: string;
  status: 'waiting' | 'in_progress' | 'completed';
}

// Hooks
export function useContacts(search?: string) {
  return useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      let query = supabase.from('contacts').select('*').order('name');
      if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useFavoriteContacts() {
  return useQuery({
    queryKey: ['contacts', 'favorites'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').eq('favorite', true).order('name');
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useCallHistory(contactId?: string, limit = 50) {
  return useQuery({
    queryKey: ['calls', contactId, limit],
    queryFn: async () => {
      let query = supabase.from('call_records').select('*').order('timestamp', { ascending: false }).limit(limit);
      if (contactId) query = query.eq('contact_id', contactId);
      const { data, error } = await query;
      if (error) throw error;
      return data as CallRecord[];
    },
  });
}

export function useQueue() {
  return useQuery({
    queryKey: ['queue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('queue_items').select('*').eq('status', 'waiting').order('priority', { ascending: false }).order('created_at');
      if (error) throw error;
      return data as QueueItem[];
    },
    refetchInterval: 5000, // Atualizar a cada 5s
  });
}

export function useCallStats(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery({
    queryKey: ['call-stats', period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      
      if (period === 'today') startDate = new Date(now.setHours(0, 0, 0, 0));
      else if (period === 'week') { startDate = new Date(); startDate.setDate(startDate.getDate() - 7); }
      else { startDate = new Date(); startDate.setMonth(startDate.getMonth() - 1); }
      
      const { data, error } = await supabase.from('call_records').select('type, status, duration').gte('timestamp', startDate.toISOString());
      if (error) throw error;
      
      const calls = data || [];
      return {
        total: calls.length,
        incoming: calls.filter(c => c.type === 'incoming').length,
        outgoing: calls.filter(c => c.type === 'outgoing').length,
        missed: calls.filter(c => c.status === 'missed').length,
        avgDuration: calls.length ? calls.reduce((a, c) => a + c.duration, 0) / calls.length : 0,
      };
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Omit<Contact, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('contacts').insert(contact).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contato criado!'); },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const { error } = await supabase.from('contacts').update({ favorite }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useRegisterCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (call: Omit<CallRecord, 'id'>) => {
      const { data, error } = await supabase.from('call_records').insert(call).select().single();
      if (error) throw error;
      // Atualizar last_call do contato
      await supabase.from('contacts').update({ last_call: new Date().toISOString() }).eq('id', call.contact_id);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calls'] }); qc.invalidateQueries({ queryKey: ['contacts'] }); },
  });
}

export default { useContacts, useFavoriteContacts, useCallHistory, useQueue, useCallStats, useCreateContact, useToggleFavorite, useRegisterCall };
