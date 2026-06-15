import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useChatbot, type ChatbotResponse } from '../useChatbot';

const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => (invoke as (...a: unknown[]) => unknown)(...args) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
  generateRequestId: () => 'req-1',
  setRequestId: vi.fn(),
  clearRequestId: vi.fn(),
  getRequestId: () => 'req-1',
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const sampleResponse: ChatbotResponse = {
  response: 'Olá',
  intent: 'greeting',
  confidence: 0.9,
  handoff: false,
  suggested_articles: [{ id: 'a1', title: 'Artigo', excerpt: null }],
};

describe('useChatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns chatbot response on success', async () => {
    invoke.mockResolvedValueOnce({ data: sampleResponse, error: null });
    const { result } = renderHook(() => useChatbot(), { wrapper });

    let res: ChatbotResponse | undefined;
    await act(async () => {
      res = await result.current.mutateAsync({ conversationId: 'c1', userMessage: 'oi' });
    });

    expect(res).toEqual(sampleResponse);
    expect(invoke).toHaveBeenCalledWith(
      'chatbot-respond',
      expect.objectContaining({
        body: { conversation_id: 'c1', user_message: 'oi' },
      }),
    );
  });

  it('handles error path and toasts', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useChatbot(), { wrapper });

    await act(async () => {
      await result.current
        .mutateAsync({ conversationId: 'c2', userMessage: 'fail' })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith('Falha ao consultar IA');
    expect(logger.error).toHaveBeenCalledWith('useChatbot.error', expect.objectContaining({ err: expect.anything() }));
  });
});
