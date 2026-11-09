import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

import { useVoipQualityAlertsSummary } from '../useVoipQualityAlertsSummary';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const sample = {
  period: 'week',
  since: '2026-01-01T00:00:00.000Z',
  total: 3,
  unacknowledged: 1,
  by_type: { degrading: 2, poor: 1, offline: 0 },
  top_users: [{ user_id: 'u1', count: 2 }],
  mos_avg_at_alert: 3.4,
  requestId: 'r1',
};

describe('useVoipQualityAlertsSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carrega o resumo com sucesso (default week)', async () => {
    invokeMock.mockResolvedValue({ data: sample, error: null });
    const { result } = renderHook(() => useVoipQualityAlertsSummary(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.requestId).toBe('r1');
    expect(invokeMock).toHaveBeenCalledWith(
      'voip-quality-alerts-summary?period=week',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('aceita período day e month (querystring no nome da function, não em `query`)', async () => {
    invokeMock.mockResolvedValue({ data: { ...sample, period: 'day' }, error: null });
    const { result } = renderHook(() => useVoipQualityAlertsSummary('day'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // supabase-js FunctionsClient.invoke não tem opção `query` — passá-la em `options` é
    // descartada em silêncio pela lib real (confirmado lendo @supabase/functions-js instalado:
    // o invoke só desestrutura headers/method/body/signal/timeout). O período tem que estar na
    // própria string do nome da function, senão a edge function recebe sempre o default 'week'.
    expect(invokeMock).toHaveBeenCalledWith(
      'voip-quality-alerts-summary?period=day',
      expect.not.objectContaining({ query: expect.anything() }),
    );
  });

  it('propaga erro da edge function', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail', status: 401 } });
    const { result } = renderHook(() => useVoipQualityAlertsSummary(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
