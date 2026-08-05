import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useConsent, type ConsentRecord } from '../useConsent';

const invokeMock = vi.fn();

interface ThenableBuilder {
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  then: (resolve: (v: { data: unknown; error: unknown }) => unknown) => Promise<unknown>;
}

let queryResult: { data: unknown; error: unknown } = { data: [], error: null };

function makeBuilder(): ThenableBuilder {
  const b: Partial<ThenableBuilder> = {};
  b.select = vi.fn(() => b as ThenableBuilder);
  b.order = vi.fn(() => b as ThenableBuilder);
  b.limit = vi.fn(() => b as ThenableBuilder);
  b.eq = vi.fn(() => b as ThenableBuilder);
  b.then = (resolve) => Promise.resolve(resolve(queryResult));
  return b as ThenableBuilder;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => makeBuilder()),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(), warn: vi.fn(), info: vi.fn(),
    create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
  },
}));

import { toast } from 'sonner';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

const sample: ConsentRecord[] = [
  { id: '1', contact_id: 'c1', phone: null, channel: 'voice', consent_type: 'recording', granted: true, granted_at: '2026-01-01', revoked_at: null, source: 'manual', recorded_by: null, notes: null, created_at: '2026-01-01' },
];

describe('useConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { data: sample, error: null };
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('carrega registros sem contactId', async () => {
    const { result } = renderHook(() => useConsent(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.records.length).toBe(1);
  });

  it('carrega registros filtrando por contactId', async () => {
    const { result } = renderHook(() => useConsent('c1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.records.length).toBe(1);
  });

  it('registra consentimento com sucesso', async () => {
    const { result } = renderHook(() => useConsent('c1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.recordConsent({ channel: 'sms', consent_type: 'marketing', contact_id: 'c1' });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Consentimento registrado'));
    expect(invokeMock).toHaveBeenCalledWith('record-consent', { body: { channel: 'sms', consent_type: 'marketing', contact_id: 'c1' } });
  });

  it('trata erro ao registrar consentimento', async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: new Error('falhou') });
    const { result } = renderHook(() => useConsent(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.recordConsent({ channel: 'email', consent_type: 'data_processing' });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Erro ao registrar consentimento', { description: 'falhou' }));
  });
});
