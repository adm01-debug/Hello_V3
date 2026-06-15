import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  orderMock: vi.fn(),
  invokeMock: vi.fn(),
  updateEqMock: vi.fn(),
  deleteEqMock: vi.fn(),
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
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ order: h.orderMock })) })),
        update: vi.fn(() => ({ eq: h.updateEqMock })),
        delete: vi.fn(() => ({ eq: h.deleteEqMock })),
      })),
      functions: { invoke: h.invokeMock },
      channel: vi.fn(() => channelObj),
      removeChannel: h.removeChannelMock,
    },
  };
});

import { useCoaching } from '@/hooks/useCoaching';
import { toast } from 'sonner';

const rec = {
  id: 'r1', agent_id: 'a1', category: 'cat', priority: 'high', title: 't',
  description: 'd', action_items: [], metrics_snapshot: {}, status: 'pending',
  created_at: '2024-01-01', reviewed_at: null, completed_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  h.orderMock.mockResolvedValue({ data: [rec], error: null });
  h.invokeMock.mockResolvedValue({ data: { recommendations: [rec] }, error: null });
  h.updateEqMock.mockResolvedValue({ error: null });
  h.deleteEqMock.mockResolvedValue({ error: null });
});

describe('useCoaching', () => {
  it('returns empty without agentId (no fetch)', async () => {
    const { result } = renderHook(() => useCoaching(undefined));
    expect(result.current.recommendations).toEqual([]);
    await act(async () => { await result.current.refetch(); });
    expect(h.orderMock).not.toHaveBeenCalled();
  });

  it('fetches recommendations and subscribes', async () => {
    const { result } = renderHook(() => useCoaching('a1'));
    await waitFor(() => expect(result.current.recommendations.length).toBe(1));
    expect(result.current.isLoading).toBe(false);
    expect(h.subscribeMock).toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    h.orderMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useCoaching('a1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.recommendations).toEqual([]);
  });

  it('generates recommendations (success)', async () => {
    const { result } = renderHook(() => useCoaching('a1'));
    await waitFor(() => expect(result.current.recommendations.length).toBe(1));
    await act(async () => { await result.current.generateRecommendations(); });
    expect(toast.success).toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
  });

  it('generates recommendations (error)', async () => {
    const { result } = renderHook(() => useCoaching('a1'));
    await waitFor(() => expect(result.current.recommendations.length).toBe(1));
    h.invokeMock.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    await act(async () => { await result.current.generateRecommendations(); });
    expect(toast.error).toHaveBeenCalled();
  });

  it('updates status to in_progress, completed, and other', async () => {
    const { result } = renderHook(() => useCoaching('a1'));
    await waitFor(() => expect(result.current.recommendations.length).toBe(1));
    await act(async () => { await result.current.updateStatus('r1', 'in_progress'); });
    await act(async () => { await result.current.updateStatus('r1', 'completed'); });
    await act(async () => { await result.current.updateStatus('r1', 'dismissed'); });
    expect(toast.success).toHaveBeenCalledWith('✅ Recomendação Concluída', expect.any(Object));
  });

  it('handles updateStatus error', async () => {
    const { result } = renderHook(() => useCoaching('a1'));
    await waitFor(() => expect(result.current.recommendations.length).toBe(1));
    h.updateEqMock.mockResolvedValueOnce({ error: { message: 'x' } });
    await act(async () => { await result.current.updateStatus('r1', 'completed'); });
    expect(toast.error).toHaveBeenCalled();
  });

  it('deletes recommendation (success and error)', async () => {
    const { result } = renderHook(() => useCoaching('a1'));
    await waitFor(() => expect(result.current.recommendations.length).toBe(1));
    await act(async () => { await result.current.deleteRecommendation('r1'); });
    expect(h.deleteEqMock).toHaveBeenCalled();

    h.deleteEqMock.mockResolvedValueOnce({ error: { message: 'x' } });
    await act(async () => { await result.current.deleteRecommendation('r1'); });
  });
});
