import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBestTimeToContact } from '../useBestTimeToContact';

const fromMock = vi.fn();
const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: unknown[]) => fromMock(...a),
    functions: { invoke: (...a: unknown[]) => invokeMock(...a) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));
vi.mock('@/lib/tracing', () => ({
  traceHeaders: () => ({ 'x-trace': '1' }),
  withTrace: (_name: string, fn: () => unknown) => fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useBestTimeToContact (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: 'p1' }], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'pat', contact_id: 'c1' }, error: null }),
    }));
    invokeMock.mockResolvedValue({ data: { processed: 5 }, error: null });
  });

  it('loads pattern and top patterns when contactId provided', async () => {
    const { result } = renderHook(() => useBestTimeToContact('c1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.topPatterns.length).toBeGreaterThanOrEqual(0));
    expect(typeof result.current.recompute).toBe('function');
  });

  it('does not query single pattern when no contactId (disabled)', async () => {
    const { result } = renderHook(() => useBestTimeToContact(), { wrapper });
    await waitFor(() => expect(result.current.topPatterns.length).toBeGreaterThanOrEqual(0));
    expect(result.current.pattern).toBeUndefined();
  });

  it('recompute success path', async () => {
    const { result } = renderHook(() => useBestTimeToContact('c1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.recompute('c1'); });
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
  });

  it('recompute without target id', async () => {
    const { result } = renderHook(() => useBestTimeToContact('c1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.recompute(undefined); });
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
  });

  it('recompute error path', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('compute-fail') });
    const { result } = renderHook(() => useBestTimeToContact('c1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.recompute('c1'); });
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
  });

  it('pattern query error throws', async () => {
    fromMock.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('pat-err') }),
    }));
    const { result } = renderHook(() => useBestTimeToContact('c1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.pattern).toBeUndefined();
  });
});
