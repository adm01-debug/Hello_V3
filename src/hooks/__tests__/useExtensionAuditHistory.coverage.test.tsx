import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const limitMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: (...args: unknown[]) => limitMock(...args),
    })),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { useExtensionAuditHistory } from '../useExtensionAuditHistory';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const entry = {
  id: '1',
  action: 'update',
  resource_type: 'agent',
  resource_id: 'a1',
  user_email: 'u@x.com',
  user_role: 'admin',
  details: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('useExtensionAuditHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fica desabilitado quando agentId é null', () => {
    const { result } = renderHook(() => useExtensionAuditHistory(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(limitMock).not.toHaveBeenCalled();
  });

  it('carrega histórico com sucesso', async () => {
    limitMock.mockResolvedValue({ data: [entry], error: null });
    const { result } = renderHook(() => useExtensionAuditHistory('a1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].id).toBe('1');
  });

  it('retorna lista vazia quando data é null', async () => {
    limitMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useExtensionAuditHistory('a2'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('propaga erro da query', async () => {
    limitMock.mockResolvedValue({ data: null, error: new Error('db error') });
    const { result } = renderHook(() => useExtensionAuditHistory('a3'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
