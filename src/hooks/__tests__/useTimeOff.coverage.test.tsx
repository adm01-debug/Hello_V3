import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTimeOff } from '../useTimeOff';

const order = vi.fn();
const select = vi.fn(() => ({ order }));
const single = vi.fn();
const insertSelect = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select: insertSelect }));
const updateSelect = vi.fn(() => ({ single }));
const eq = vi.fn(() => ({ select: updateSelect }));
const update = vi.fn(() => ({ eq }));

const from = vi.fn(() => ({ select, insert, update }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...a: unknown[]) => (from as (...args: unknown[]) => unknown)(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    create: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}));

import { toast } from 'sonner';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.clearAllMocks();
  order.mockResolvedValue({ data: [{ id: 't1', agent_name: 'Ana', status: 'pending' }], error: null });
});

describe('useTimeOff', () => {
  it('lists requests on success', async () => {
    const { result } = renderHook(() => useTimeOff(), { wrapper });
    await waitFor(() => expect(result.current.requests.length).toBe(1));
    expect(result.current.requests[0].id).toBe('t1');
  });

  it('list error leaves requests empty', async () => {
    order.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useTimeOff(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toEqual([]);
  });

  it('create success shows toast', async () => {
    single.mockResolvedValue({ data: { id: 'new' }, error: null });
    const { result } = renderHook(() => useTimeOff(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.create({ agent_name: 'Ana', start_date: '2024-01-01', end_date: '2024-01-02', request_type: 'vacation', reason: null });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Solicitação enviada'));
    expect(insert).toHaveBeenCalled();
  });

  it('create error shows error toast', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'bad' } });
    const { result } = renderHook(() => useTimeOff(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.create({ agent_name: 'Ana', start_date: '2024-01-01', end_date: '2024-01-02', request_type: 'vacation', reason: 'x' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao solicitar folga'));
  });

  it('review success shows toast', async () => {
    single.mockResolvedValue({ data: { id: 't1', status: 'approved' }, error: null });
    const { result } = renderHook(() => useTimeOff(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.review({ id: 't1', status: 'approved', reviewer_notes: 'ok' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Solicitação revisada'));
    expect(update).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 't1');
  });

  it('review error shows error toast', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'bad' } });
    const { result } = renderHook(() => useTimeOff(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.review({ id: 't1', status: 'rejected' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao revisar'));
  });
});
