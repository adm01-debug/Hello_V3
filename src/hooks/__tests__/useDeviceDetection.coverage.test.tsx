import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeviceDetection } from '../useDeviceDetection';

interface Res { data: unknown; error: unknown }
let sessionsRes: Res = { data: [], error: null };
const invoke = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(sessionsRes)) })),
    })),
    functions: { invoke: (...a: unknown[]) => invoke(...a) },
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

describe('useDeviceDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionsRes = { data: [], error: null };
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ip: '1.2.3.4', country_name: 'BR', city: 'SP', country_code: 'BR' }),
    } as unknown as Response)));
  });

  it('returns device info helpers', () => {
    const { result } = renderHook(() => useDeviceDetection());
    const info = result.current.getDeviceInfo();
    expect(info.browser).toBeDefined();
    expect(info.os).toBeDefined();
    expect(info.device).toBeDefined();
  });

  it('detects new device when existing sessions and new IP', async () => {
    sessionsRes = { data: [{ ip_address: '9.9.9.9', device_info: { browser: 'X', os: 'Y', device: 'Desktop' } }], error: null };
    const { result } = renderHook(() => useDeviceDetection());
    let out: { isNewDevice: boolean } | undefined;
    await act(async () => { out = await result.current.checkAndNotifyNewDevice('u1', 'e@x.com', 'Name'); });
    expect(out?.isNewDevice).toBe(true);
    expect(invoke).toHaveBeenCalledWith('notify-new-device', expect.anything());
  });

  it('no notification when no existing sessions', async () => {
    sessionsRes = { data: [], error: null };
    const { result } = renderHook(() => useDeviceDetection());
    await act(async () => { await result.current.checkAndNotifyNewDevice('u1', 'e@x.com'); });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('handles supabase query error', async () => {
    sessionsRes = { data: null, error: new Error('db') };
    const { result } = renderHook(() => useDeviceDetection());
    let out: { isNewDevice: boolean } | undefined;
    await act(async () => { out = await result.current.checkAndNotifyNewDevice('u1', 'e@x.com'); });
    expect(out?.isNewDevice).toBe(false);
  });

  it('handles location fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('net'))));
    const { result } = renderHook(() => useDeviceDetection());
    const loc = await result.current.getLocationInfo();
    expect(loc.ip).toBe('Unknown');
  });

  it('handles notify invoke error branch', async () => {
    invoke.mockResolvedValueOnce({ error: new Error('notify') });
    sessionsRes = { data: [{ ip_address: '9.9.9.9', device_info: null }], error: null };
    const { result } = renderHook(() => useDeviceDetection());
    await act(async () => { await result.current.checkAndNotifyNewDevice('u1', 'e@x.com'); });
    expect(invoke).toHaveBeenCalled();
  });
});
