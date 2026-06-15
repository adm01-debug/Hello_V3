import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNetworkMonitor } from '../useNetworkMonitor';

const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invokeMock(...a) } },
}));
vi.mock('@/lib/tracing', () => ({ traceHeaders: () => ({ 'x-trace': '1' }) }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

describe('useNetworkMonitor (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('pings and classifies as online on success', async () => {
    const { result } = renderHook(() => useNetworkMonitor(true));
    await waitFor(() => expect(result.current.lastCheckedAt).not.toBeNull());
    expect(['online', 'unstable', 'checking']).toContain(result.current.status);
    expect(invokeMock).toHaveBeenCalledWith('health-check', expect.objectContaining({ method: 'GET' }));
  });

  it('reports offline when navigator is offline', async () => {
    setOnline(false);
    const { result } = renderHook(() => useNetworkMonitor(true));
    await waitFor(() => expect(result.current.status).toBe('offline'));
    expect(result.current.consecutiveFailures).toBeGreaterThanOrEqual(1);
  });

  it('handles ping error -> unstable then offline after repeated failures', async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error('ping') });
    const { result } = renderHook(() => useNetworkMonitor(true));
    await waitFor(() => expect(result.current.consecutiveFailures).toBeGreaterThanOrEqual(1));
    await act(async () => { await result.current.refresh(); });
    await waitFor(() => expect(result.current.consecutiveFailures).toBeGreaterThanOrEqual(2));
    expect(result.current.status).toBe('offline');
  });

  it('does nothing when disabled', async () => {
    renderHook(() => useNetworkMonitor(false));
    await new Promise(r => setTimeout(r, 20));
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('reacts to online/offline window events', async () => {
    const { result } = renderHook(() => useNetworkMonitor(true));
    await waitFor(() => expect(result.current.lastCheckedAt).not.toBeNull());
    act(() => { window.dispatchEvent(new Event('offline')); });
    await waitFor(() => expect(result.current.status).toBe('offline'));
    act(() => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
  });
});
