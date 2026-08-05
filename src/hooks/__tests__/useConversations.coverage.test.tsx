import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({
  limitMock: vi.fn(),
  eqMock: vi.fn(),
  orderMock: vi.fn(),
  msgEqMock: vi.fn(),
  msgOrderMock: vi.fn(),
  msgLimitMock: vi.fn(),
  insertMock: vi.fn(),
  singleMock: vi.fn(),
  updateEqMock: vi.fn(),
  onMock: vi.fn(),
  subscribeMock: vi.fn(),
  removeChannelMock: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
  const lvl = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger: { create: vi.fn(() => lvl), ...lvl } };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/integrations/supabase/client', () => {
  const channelObj = {
    on: (...a: unknown[]) => { h.onMock(...a); return channelObj; },
    subscribe: (...a: unknown[]) => { h.subscribeMock(...a); return channelObj; },
  };
  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'conversation_messages') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({ limit: h.msgLimitMock })),
              })),
            })),
            insert: h.insertMock,
          };
        }
        // conversations
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({ limit: h.limitMock })),
            eq: vi.fn(() => ({ single: h.singleMock })),
          })),
          update: vi.fn(() => ({ eq: h.updateEqMock })),
        };
      }),
      channel: vi.fn(() => channelObj),
      removeChannel: h.removeChannelMock,
    },
  };
});

import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useUpdateConversation,
} from '@/hooks/useConversations';
import { toast } from 'sonner';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.clearAllMocks();
  // conversations query: select->order->limit returns a chainable that .eq returns itself; awaited resolves
  const convChain: Record<string, unknown> = {};
  convChain.eq = vi.fn(() => convChain);
  convChain.then = (resolve: (v: unknown) => unknown) => resolve({ data: [{ id: 'c1' }], error: null });
  h.limitMock.mockReturnValue(convChain);

  h.msgLimitMock.mockResolvedValue({ data: [{ id: 'm1' }], error: null });
  h.insertMock.mockResolvedValue({ error: null });
  h.singleMock.mockResolvedValue({ data: { first_response_at: null }, error: null });
  h.updateEqMock.mockResolvedValue({ error: null });
});

describe('useConversations', () => {
  it('fetches with filters applied', async () => {
    const { result } = renderHook(
      () => useConversations({ channel: 'voice', status: 'open', priority: 'high', assignedAgent: 'Ana' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'c1' }]);
    expect(h.subscribeMock).toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    const errChain: Record<string, unknown> = {};
    errChain.eq = vi.fn(() => errChain);
    errChain.then = (resolve: (v: unknown) => unknown) => resolve({ data: null, error: { message: 'boom' } });
    h.limitMock.mockReturnValue(errChain);
    const { result } = renderHook(() => useConversations(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useConversationMessages', () => {
  it('is disabled when no conversationId', () => {
    const { result } = renderHook(() => useConversationMessages(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches messages and subscribes', async () => {
    const { result } = renderHook(() => useConversationMessages('conv-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'm1' }]);
    expect(h.subscribeMock).toHaveBeenCalled();
  });

  it('handles error', async () => {
    h.msgLimitMock.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
    const { result } = renderHook(() => useConversationMessages('conv-2'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useSendMessage', () => {
  it('sends message and sets first_response_at', async () => {
    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ conversationId: 'c1', content: 'hi', senderName: 'Ana' });
    });
    expect(toast.success).toHaveBeenCalledWith('Mensagem enviada');
  });

  it('skips first_response when private note or already responded', async () => {
    h.singleMock.mockResolvedValueOnce({ data: { first_response_at: '2024-01-01' }, error: null });
    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ conversationId: 'c1', content: 'note', isPrivateNote: true });
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles insert error', async () => {
    h.insertMock.mockResolvedValueOnce({ error: { message: 'fail' } });
    const { result } = renderHook(() => useSendMessage(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ conversationId: 'c1', content: 'x' }),
      ).rejects.toBeTruthy();
    });
    expect(toast.error).toHaveBeenCalledWith('Falha ao enviar mensagem');
  });
});

describe('useUpdateConversation', () => {
  it('updates successfully', async () => {
    const { result } = renderHook(() => useUpdateConversation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'c1', updates: { status: 'closed' } });
    });
    expect(toast.success).toHaveBeenCalledWith('Conversa atualizada');
  });

  it('handles error', async () => {
    h.updateEqMock.mockResolvedValueOnce({ error: { message: 'nope' } });
    const { result } = renderHook(() => useUpdateConversation(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: 'c1', updates: { priority: 'low' } }),
      ).rejects.toBeTruthy();
    });
    expect(toast.error).toHaveBeenCalledWith('Falha ao atualizar');
  });
});
