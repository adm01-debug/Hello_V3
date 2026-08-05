import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSipCall } from '../useSipCall';

const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invokeMock(...a) } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: { create: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }) } }));

const startTracking = vi.fn();
const endTracking = vi.fn().mockResolvedValue(undefined);
const suggest = vi.fn();
vi.mock('../useVoipQualityMonitor', () => ({ useVoipQualityMonitor: () => ({ current: { mos: 4.2, jitterMs: 10, rttMs: 20 } }) }));
vi.mock('../useQualityTrendAnalyzer', () => ({ useQualityTrendAnalyzer: () => undefined }));
vi.mock('../useVoipAutoRemediation', () => ({ useVoipAutoRemediation: () => ({ suggest }) }));
vi.mock('../useTrunkUsageReporter', () => ({ useTrunkUsageReporter: () => ({ startTracking, endTracking }) }));

// JsSIP mock
type Handler = (e: unknown) => void;
class MockUA {
  handlers: Record<string, Handler[]> = {};
  registered = false;
  static lastInstance: MockUA | null = null;
  constructor(public config: unknown) { MockUA.lastInstance = this; }
  on(event: string, cb: Handler) { (this.handlers[event] ||= []).push(cb); return this; }
  emit(event: string, e?: unknown) { (this.handlers[event] || []).forEach(h => h(e)); }
  start() { /* noop */ }
  stop() { /* noop */ }
  isRegistered() { return this.registered; }
  call() {
    const session = new MockSession();
    MockSession.last = session;
    this.emit('newRTCSession', { session });
    return session;
  }
}
class MockSession {
  handlers: Record<string, Handler[]> = {};
  static last: MockSession | null = null;
  direction = 'outgoing';
  connection: unknown = { ontrack: null, getSenders: () => [{ track: { onmute: null, onunmute: null } }] };
  remote_identity = { uri: { toString: () => 'sip:1@x', user: '1' }, display_name: 'X' };
  on(event: string, cb: Handler) { (this.handlers[event] ||= []).push(cb); return this; }
  emit(event: string, e?: unknown) { (this.handlers[event] || []).forEach(h => h(e)); }
  terminate() { /* noop */ }
  mute() { /* noop */ }
  unmute() { /* noop */ }
  hold() { /* noop */ }
  unhold() { /* noop */ }
  sendDTMF() { /* noop */ }
}
vi.mock('jssip', () => ({
  default: {
    UA: class { constructor(c: unknown) { return new MockUA(c); } },
    WebSocketInterface: class { constructor(public url: string) {} },
  },
  UA: class { constructor(c: unknown) { return new MockUA(c); } },
}));

describe('useSipCall (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockUA.lastInstance = null;
    MockSession.last = null;
    invokeMock.mockResolvedValue({
      data: { configured: true, server: 'sip.example.com', username: 'u', password: 'p' },
      error: null,
    });
    (globalThis as unknown as { Audio: unknown }).Audio = function Audio() {
      const el = document.createElement('audio') as HTMLAudioElement & { srcObject: unknown };
      el.play = () => Promise.resolve();
      el.pause = () => undefined;
      el.srcObject = null;
      return el;
    };
  });
  afterEach(() => { vi.useRealTimers(); });

  it('initial state is disconnected', () => {
    const { result } = renderHook(() => useSipCall());
    expect(result.current.status).toBe('disconnected');
    expect(result.current.isInCall).toBe(false);
  });

  it('connect succeeds and registers', async () => {
    const { result } = renderHook(() => useSipCall());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.connect(); });
    expect(ok).toBe(true);
    expect(startTracking).toHaveBeenCalled();
    await act(async () => { MockUA.lastInstance?.emit('registered'); });
    await waitFor(() => expect(result.current.isRegistered).toBe(true));
  });

  it('connect with failover shows warning', async () => {
    invokeMock.mockResolvedValue({
      data: { configured: true, server: 's', username: 'u', password: 'p', failover: true, failover_reason: 'down', trunk_id: 't2', original_trunk_id: 't1' },
      error: null,
    });
    const { result } = renderHook(() => useSipCall());
    await act(async () => { await result.current.connect(); });
    const { toast } = await import('sonner');
    expect(toast.warning).toHaveBeenCalled();
  });

  it('connect fails when not configured', async () => {
    invokeMock.mockResolvedValue({ data: { configured: false, error: 'no creds' }, error: null });
    const { result } = renderHook(() => useSipCall());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.connect(); });
    expect(ok).toBe(false);
    expect(result.current.status).toBe('error');
  });

  it('connect throws -> error state', async () => {
    invokeMock.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useSipCall());
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.connect(); });
    expect(ok).toBe(false);
    expect(result.current.status).toBe('error');
  });

  it('registration failed sets error', async () => {
    const { result } = renderHook(() => useSipCall());
    await act(async () => { await result.current.connect(); });
    await act(async () => { MockUA.lastInstance?.emit('registrationFailed', { cause: 'rejected' }); });
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('handles UA lifecycle events (connected/disconnected/unregistered)', async () => {
    const { result } = renderHook(() => useSipCall());
    await act(async () => { await result.current.connect(); });
    await act(async () => {
      MockUA.lastInstance?.emit('connected');
      MockUA.lastInstance?.emit('registered');
      MockUA.lastInstance?.emit('unregistered');
      MockUA.lastInstance?.emit('disconnected');
    });
    await waitFor(() => expect(result.current.isRegistered).toBe(false));
  });

  async function connectAndRegister(result: { current: ReturnType<typeof useSipCall> }) {
    await act(async () => { await result.current.connect(); });
    await act(async () => { MockUA.lastInstance!.registered = true; MockUA.lastInstance?.emit('registered'); });
    await waitFor(() => expect(result.current.isRegistered).toBe(true));
  }

  it('startCall dials and progresses through session events', async () => {
    const { result } = renderHook(() => useSipCall());
    await connectAndRegister(result);

    await act(async () => { await result.current.startCall('(11) 99999-8888'); });

    const session = MockSession.last!;
    await act(async () => { session.emit('progress'); });
    await waitFor(() => expect(result.current.status).toBe('ringing'));
    await act(async () => { session.emit('accepted'); });
    await waitFor(() => expect(result.current.status).toBe('active'));
    await act(async () => { session.emit('confirmed'); });
    await act(async () => { session.emit('hold'); });
    await act(async () => { session.emit('unhold'); });
    await act(async () => { session.emit('ended', { cause: 'BYE' }); });
    await waitFor(() => expect(result.current.callId).toBeNull());
  });

  it('startCall failed branch', async () => {
    const { result } = renderHook(() => useSipCall());
    await connectAndRegister(result);
    await act(async () => { await result.current.startCall('123'); });
    const session = MockSession.last!;
    await act(async () => { session.emit('failed', { cause: 'BUSY' }); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it('toggleMute, toggleHold, sendDTMF, endCall, disconnect operate on session', async () => {
    const { result } = renderHook(() => useSipCall());
    await connectAndRegister(result);
    await act(async () => { await result.current.startCall('123'); });

    act(() => result.current.toggleMute(true));
    await waitFor(() => expect(result.current.isMuted).toBe(true));
    act(() => result.current.toggleMute(false));
    act(() => result.current.toggleHold(true));
    await waitFor(() => expect(result.current.isOnHold).toBe(true));
    act(() => result.current.toggleHold(false));
    act(() => result.current.sendDTMF('5'));
    act(() => result.current.endCall());
    act(() => result.current.disconnect());
    await waitFor(() => expect(result.current.status).toBe('disconnected'));
  });
});
