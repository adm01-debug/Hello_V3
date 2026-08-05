import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGeoBlocking } from '../useGeoBlocking';

const fromMock = vi.fn();
const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => (fromMock as (...a: unknown[]) => unknown)(...args),
    functions: { invoke: (...args: unknown[]) => (invokeMock as (...a: unknown[]) => unknown)(...args) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

function makeFrom(table: string, settingsData: unknown) {
  if (table === 'geo_settings') {
    return {
      select: vi.fn(() => ({ limit: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: settingsData, error: null }) })) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null }) })) })),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    };
  }
  if (table === 'geo_restrictions') {
    return {
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [{ id: 'r1', country_code: 'BR', country_name: 'Brasil', restriction_type: 'allow', reason: null, created_at: '', created_by: null }], error: null }) })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    };
  }
  // geo_access_logs
  return {
    select: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn().mockResolvedValue({ data: [{ id: 'l1', action: 'blocked' }, { id: 'l2', action: 'allowed' }], error: null }) })) })),
  };
}

describe('useGeoBlocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation((table: string) => makeFrom(table, { id: 's1', enabled: false, mode: 'allowlist', log_blocked_attempts: true, notify_on_block: false }));
    invokeMock.mockResolvedValue({ data: { allowed: true, country_name: 'Brasil' }, error: null });
  });

  it('carrega settings, restrictions e logs', async () => {
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));
    await waitFor(() => expect(result.current.allowedCountries.length).toBeGreaterThan(0));
    expect(result.current.blockedLogs.length).toBe(1);
    expect(result.current.availableCountries.length).toBeGreaterThan(0);
  });

  it('inicializa settings quando ausentes', async () => {
    fromMock.mockImplementation((table: string) => makeFrom(table, null));
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));
    await waitFor(() => expect(fromMock).toHaveBeenCalledWith('geo_settings'));
  });

  it('atualiza settings com sucesso', async () => {
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));
    await act(async () => { await result.current.updateSettings.mutateAsync({ enabled: true }); });
  });

  it('setters de estado funcionam', async () => {
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    act(() => { result.current.setSelectedCountry('US'); result.current.setReason('teste'); result.current.setTestIp('1.2.3.4'); });
    await waitFor(() => expect(result.current.selectedCountry).toBe('US'));
  });

  it('adiciona país (sucesso) e país inexistente (erro)', async () => {
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));
    act(() => { result.current.setSelectedCountry('US'); result.current.setReason('motivo'); });
    await act(async () => { await result.current.addCountry.mutateAsync(); });

    act(() => { result.current.setSelectedCountry('ZZ'); });
    await act(async () => {
      await expect(result.current.addCountry.mutateAsync()).rejects.toThrow();
    });
  });

  it('remove país', async () => {
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    await waitFor(() => expect(result.current.settingsLoading).toBe(false));
    await act(async () => { await result.current.removeCountry.mutateAsync('r1'); });
  });

  it('testa validação geo permitida e bloqueada', async () => {
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    await act(async () => { await result.current.testGeoValidation.mutateAsync('1.2.3.4'); });
    await waitFor(() => expect(result.current.testResult).toBeTruthy());

    invokeMock.mockResolvedValue({ data: { allowed: false, country_name: 'Cuba', reason: 'Bloqueado' }, error: null });
    await act(async () => { await result.current.testGeoValidation.mutateAsync('5.6.7.8'); });
  });

  it('propaga erro de invoke na validação geo', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('fail') });
    const { result } = renderHook(() => useGeoBlocking(), { wrapper });
    await act(async () => {
      await expect(result.current.testGeoValidation.mutateAsync('9.9.9.9')).rejects.toBeTruthy();
    });
  });
});
