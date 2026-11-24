import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQueueAudioPrompts } from '../useQueueAudioPrompts';
import { toast } from 'sonner';

const h = vi.hoisted(() => ({
  order: [] as string[],
  removeMock: vi.fn(),
  deleteEqMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => {
  const lvl = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger: { create: vi.fn(() => lvl), ...lvl } };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        remove: (...a: unknown[]) => {
          h.order.push('storage.remove');
          return h.removeMock(...a);
        },
        upload: vi.fn(async () => ({ error: null })),
        createSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'x' }, error: null })),
      }),
    },
    from: () => ({
      select: () => ({ order: () => ({ order: async () => ({ data: [], error: null }) }) }),
      delete: () => ({ eq: (...a: unknown[]) => {
        h.order.push('db.delete');
        return h.deleteEqMock(...a);
      } }),
    }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const prompt = {
  id: 'p1',
  name: 'Aviso',
  description: null,
  kind: 'hold' as const,
  storage_path: 'hold/aviso.mp3',
  mime_type: 'audio/mpeg',
  file_size_bytes: 10,
  duration_seconds: 3,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('useQueueAudioPrompts.deletePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.order.length = 0;
    h.removeMock.mockResolvedValue({ data: null, error: null });
    h.deleteEqMock.mockResolvedValue({ error: null });
  });

  it('remove o objeto do bucket antes da linha e avisa sucesso', async () => {
    const { result } = renderHook(() => useQueueAudioPrompts(), { wrapper });
    await act(async () => { await result.current.deletePrompt.mutateAsync(prompt as never); });
    expect(h.order).toEqual(['storage.remove', 'db.delete']);
    expect(toast.success).toHaveBeenCalledWith('Áudio removido');
  });

  it('mantém a linha e avisa quando o bucket recusa a remoção', async () => {
    h.removeMock.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const { result } = renderHook(() => useQueueAudioPrompts(), { wrapper });
    await act(async () => {
      await expect(result.current.deletePrompt.mutateAsync(prompt as never)).rejects.toBeTruthy();
    });
    expect(h.order).toEqual(['storage.remove']);
    expect(h.deleteEqMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Não foi possível remover o áudio');
    expect(toast.success).not.toHaveBeenCalledWith('Áudio removido');
  });
});