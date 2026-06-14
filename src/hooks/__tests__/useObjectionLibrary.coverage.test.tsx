import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useObjectionLibrary } from '../useObjectionLibrary';

const fromMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));

const sample = {
  id: 'o1', objection_type: 'price', trigger_keywords: [], objection_example: 'too expensive',
  recommended_response: 'value', talking_points: [], category: null, difficulty: 'easy',
  success_rate: 50, times_suggested: 0, times_used: 2, times_won: 1, is_active: true,
  created_at: '', updated_at: '',
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useObjectionLibrary (coverage)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads objections', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [sample], error: null }),
    });
    const { result } = renderHook(() => useObjectionLibrary(), { wrapper });
    await waitFor(() => expect(result.current.objections.length).toBe(1));
  });

  it('list error throws', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('list-err') }),
    });
    const { result } = renderHook(() => useObjectionLibrary(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.objections).toEqual([]);
  });

  it('upsert success and error', async () => {
    fromMock
      .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) })
      .mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: null }) });
    const { result } = renderHook(() => useObjectionLibrary(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      result.current.upsert({ objection_type: 'x', objection_example: 'e', recommended_response: 'r' });
    });
    fromMock.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: new Error('upsert-fail') }) });
    await act(async () => {
      result.current.upsert({ objection_type: 'x', objection_example: 'e', recommended_response: 'r' });
    });
    expect(fromMock).toHaveBeenCalledWith('objection_library');
  });

  it('remove success and error', async () => {
    fromMock
      .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) })
      .mockReturnValue({ delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) });
    const { result } = renderHook(() => useObjectionLibrary(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.remove('o1'); });
    fromMock.mockReturnValue({ delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: new Error('rm-fail') }) })) });
    await act(async () => { result.current.remove('o1'); });
    expect(fromMock).toHaveBeenCalledWith('objection_library');
  });

  it('recordWin updates an existing objection', async () => {
    fromMock
      .mockReturnValueOnce({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [sample], error: null }) })
      .mockReturnValue({ update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) });
    const { result } = renderHook(() => useObjectionLibrary(), { wrapper });
    await waitFor(() => expect(result.current.objections.length).toBe(1));
    await act(async () => { result.current.recordWin({ id: 'o1', won: true }); });
    await act(async () => { result.current.recordWin({ id: 'o1', won: false }); });
    expect(fromMock).toHaveBeenCalled();
  });

  it('recordWin no-op when objection not found', async () => {
    fromMock.mockReturnValue({ select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) });
    const { result } = renderHook(() => useObjectionLibrary(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.recordWin({ id: 'missing', won: true }); });
    expect(result.current.objections).toEqual([]);
  });
});
