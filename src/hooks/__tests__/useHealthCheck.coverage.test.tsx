import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHealthCheck } from '../useHealthCheck';

const fromSelect = vi.fn();
const getSession = vi.fn();
const invoke = vi.fn();
const listBuckets = vi.fn();
const subscribe = vi.fn();
const removeChannel = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: vi.fn(() => ({ limit: (...a: unknown[]) => (fromSelect as (...x: unknown[]) => unknown)(...a) })) })),
    auth: { getSession: (...a: unknown[]) => (getSession as (...x: unknown[]) => unknown)(...a) },
    functions: { invoke: (...a: unknown[]) => (invoke as (...x: unknown[]) => unknown)(...a) },
    storage: { listBuckets: (...a: unknown[]) => (listBuckets as (...x: unknown[]) => unknown)(...a) },
    channel: vi.fn(() => ({ subscribe: (cb: (status: string) => void) => { (subscribe as (...x: unknown[]) => unknown)(cb); return {}; } })),
    removeChannel: (...a: unknown[]) => (removeChannel as (...x: unknown[]) => unknown)(...a),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/tracing', () => ({
  traceHeaders: () => ({ 'x-trace-id': 't1' }),
  withTrace: async (_op: string, fn: () => Promise<void>) => fn(),
}));

describe('useHealthCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromSelect.mockResolvedValue({ error: null });
    getSession.mockResolvedValue({ error: null });
    invoke.mockResolvedValue({ error: null });
    listBuckets.mockResolvedValue({ error: null });
    subscribe.mockImplementation((cb: (status: string) => void) => cb('SUBSCRIBED'));
  });

  it('estado inicial: todos checking', () => {
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.services).toHaveLength(5);
    expect(result.current.isChecking).toBe(false);
  });

  it('runChecks com todos saudáveis => overall healthy', async () => {
    const { result } = renderHook(() => useHealthCheck());
    await act(async () => { await result.current.runChecks(); });
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.overallStatus).toBe('healthy');
    expect(result.current.services.every((s) => s.status === 'healthy')).toBe(true);
  });

  it('uma falha => degraded', async () => {
    fromSelect.mockResolvedValue({ error: new Error('db down') });
    const { result } = renderHook(() => useHealthCheck());
    await act(async () => { await result.current.runChecks(); });
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.overallStatus).toBe('degraded');
    const db = result.current.services.find((s) => s.name === 'Database');
    expect(db?.status).toBe('down');
    expect(db?.error).toBe('db down');
  });

  it('mais de 2 falhas => down', async () => {
    fromSelect.mockResolvedValue({ error: new Error('e') });
    getSession.mockResolvedValue({ error: new Error('e') });
    invoke.mockResolvedValue({ error: new Error('e') });
    const { result } = renderHook(() => useHealthCheck());
    await act(async () => { await result.current.runChecks(); });
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.overallStatus).toBe('down');
  });

  it('realtime com status não-SUBSCRIBED rejeita', async () => {
    subscribe.mockImplementation((cb: (status: string) => void) => cb('CHANNEL_ERROR'));
    const { result } = renderHook(() => useHealthCheck());
    await act(async () => { await result.current.runChecks(); });
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    const rt = result.current.services.find((s) => s.name === 'Realtime');
    expect(rt?.status).toBe('down');
  });

  it('erro não-Error vira Unknown error', async () => {
    listBuckets.mockRejectedValue('string error');
    const { result } = renderHook(() => useHealthCheck());
    await act(async () => { await result.current.runChecks(); });
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    const storage = result.current.services.find((s) => s.name === 'Storage');
    expect(storage?.error).toBe('Unknown error');
  });
});
