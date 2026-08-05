import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMultiDeviceRing } from '../useMultiDeviceRing';

interface QueryResult { data: unknown; error: unknown }
let devicesResult: QueryResult = { data: [{ id: 'd1', is_enabled: true }, { id: 'd2', is_enabled: false }], error: null };
let settingsResult: QueryResult = { data: null, error: null };
let existingSettings: QueryResult = { data: null, error: null };
const insertFn = vi.fn().mockResolvedValue({ error: null });
const updateEq = vi.fn().mockResolvedValue({ error: null });
const deleteEq = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ profile: { full_name: 'Agent X', email: 'x@y.z' } }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve(devicesResult)),
        maybeSingle: vi.fn(() => Promise.resolve(table === 'agent_ring_settings' ? (existingSettings.data ? existingSettings : settingsResult) : settingsResult)),
      })),
      insert: (...a: unknown[]) => insertFn(...a),
      update: vi.fn(() => ({ eq: (...a: unknown[]) => updateEq(...a) })),
      delete: vi.fn(() => ({ eq: (...a: unknown[]) => deleteEq(...a) })),
    })),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

describe('useMultiDeviceRing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devicesResult = { data: [{ id: 'd1', is_enabled: true }, { id: 'd2', is_enabled: false }], error: null };
    settingsResult = { data: null, error: null };
    existingSettings = { data: null, error: null };
  });

  it('loads devices and default settings, runs mutations', async () => {
    const { result } = renderHook(() => useMultiDeviceRing(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.devices.length).toBe(2);
    expect(result.current.enabledCount).toBe(1);
    expect(result.current.ringSettings?.ring_strategy).toBe('simultaneous');

    act(() => { result.current.setAddDialogOpen(true); result.current.setNewDevice({ device_name: 'D', device_type: 'mobile', sip_uri: 's', extension: '1' }); });

    await act(async () => { result.current.addDevice.mutate(result.current.newDevice); });
    await waitFor(() => expect(insertFn).toHaveBeenCalled());

    await act(async () => { result.current.toggleDevice.mutate({ id: 'd1', enabled: false }); });
    await waitFor(() => expect(updateEq).toHaveBeenCalled());

    await act(async () => { result.current.deleteDevice.mutate('d1'); });
    await waitFor(() => expect(deleteEq).toHaveBeenCalled());

    await act(async () => { result.current.updateSettings.mutate({ ring_timeout_seconds: 20 }); });
    await waitFor(() => expect(insertFn).toHaveBeenCalledTimes(2));
  });

  it('updateSettings updates existing record', async () => {
    existingSettings = { data: { id: 'rs1' }, error: null };
    const { result } = renderHook(() => useMultiDeviceRing(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.updateSettings.mutate({ dnd_enabled: true }); });
    await waitFor(() => expect(updateEq).toHaveBeenCalled());
  });

  it('addDevice error path', async () => {
    insertFn.mockResolvedValueOnce({ error: new Error('boom') });
    const { result } = renderHook(() => useMultiDeviceRing(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { result.current.addDevice.mutate(result.current.newDevice); });
    await waitFor(() => expect(insertFn).toHaveBeenCalled());
  });
});
