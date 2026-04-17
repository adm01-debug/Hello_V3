import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { traceHeaders, withTrace } from '@/lib/tracing';
import { toast } from 'sonner';

export interface ChatbotResponse {
  response: string;
  intent: string;
  confidence: number;
  handoff: boolean;
  suggested_articles: Array<{ id: string; title: string; excerpt: string | null }>;
}

export function useChatbot() {
  return useMutation({
    mutationFn: async (params: {
      conversationId: string;
      userMessage: string;
    }): Promise<ChatbotResponse> => {
      const { data, error } = await withTrace('chatbot-respond', () =>
        supabase.functions.invoke('chatbot-respond', {
          body: {
            conversation_id: params.conversationId,
            user_message: params.userMessage,
          },
          headers: traceHeaders(),
        }),
      );
      if (error) throw error;
      return data as ChatbotResponse;
    },
    onError: (err) => {
      logger.error('useChatbot.error', { err });
      toast.error('Falha ao consultar IA');
    },
  });
}
