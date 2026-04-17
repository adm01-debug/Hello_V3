import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export type ConversationChannel = 'voice' | 'whatsapp' | 'email' | 'chat' | 'sms';
export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed' | 'snoozed';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Conversation {
  id: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  priority: ConversationPriority;
  subject: string | null;
  assigned_agent_name: string | null;
  contact_id: string | null;
  account_id: string | null;
  tags: string[] | null;
  first_response_at: string | null;
  last_message_at: string;
  resolved_at: string | null;
  sla_first_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  sla_breached: boolean | null;
  unread_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound' | 'internal';
  sender_type: 'contact' | 'agent' | 'bot' | 'system';
  sender_name: string | null;
  sender_identifier: string | null;
  content: string;
  content_type: string;
  attachments: unknown;
  is_private_note: boolean | null;
  read_at: string | null;
  created_at: string;
}

export interface ConversationFilters {
  channel?: ConversationChannel;
  status?: ConversationStatus;
  assignedAgent?: string;
  priority?: ConversationPriority;
}

export function useConversations(filters: ConversationFilters = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      let q = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(200);

      if (filters.channel) q = q.eq('channel', filters.channel);
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.priority) q = q.eq('priority', filters.priority);
      if (filters.assignedAgent) q = q.eq('assigned_agent_name', filters.assignedAgent);

      const { data, error } = await q;
      if (error) {
        logger.error('useConversations.fetch', { error });
        throw error;
      }
      return (data ?? []) as Conversation[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversation-messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(500);
      if (error) {
        logger.error('useConversationMessages.fetch', { error });
        throw error;
      }
      return (data ?? []) as ConversationMessage[];
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      conversationId: string;
      content: string;
      isPrivateNote?: boolean;
      senderName?: string;
    }) => {
      const { error } = await supabase.from('conversation_messages').insert({
        conversation_id: params.conversationId,
        direction: 'outbound',
        sender_type: 'agent',
        sender_name: params.senderName ?? null,
        content: params.content,
        content_type: 'text',
        is_private_note: params.isPrivateNote ?? false,
      });
      if (error) throw error;

      // Atualizar last_message_at e first_response_at se ainda não houver
      const { data: conv } = await supabase
        .from('conversations')
        .select('first_response_at')
        .eq('id', params.conversationId)
        .single();

      const updates: Record<string, unknown> = {
        last_message_at: new Date().toISOString(),
      };
      if (!conv?.first_response_at && !params.isPrivateNote) {
        updates.first_response_at = new Date().toISOString();
      }
      await supabase.from('conversations').update(updates).eq('id', params.conversationId);
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', params.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Mensagem enviada');
    },
    onError: (err) => {
      logger.error('useSendMessage.error', { err });
      toast.error('Falha ao enviar mensagem');
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<Conversation> }) => {
      const { error } = await supabase
        .from('conversations')
        .update(params.updates)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversa atualizada');
    },
    onError: (err) => {
      logger.error('useUpdateConversation.error', { err });
      toast.error('Falha ao atualizar');
    },
  });
}
