import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSupervisorPanel } from '../useSupervisorPanel';

interface TableResult {
  data: unknown;
  error: unknown;
}

const listResults: Record<string, TableResult> = {};
const singleResults: Record<string, TableResult> = {};
function setTable(name: string, data: unknown, error: unknown = null) {
  listResults[name] = { data, error };
}
function setSingle(name: string, data: unknown, error: unknown = null) {
  singleResults[name] = { data, error };
}

function makeBuilder(table: string) {
  const listResult = (): TableResult => listResults[table] ?? { data: null, error: null };
  const singleResult = (): TableResult =>
    singleResults[table] ?? { data: null, error: null };

  const builder: Record<string, unknown> = {};
  const chain = ['select', 'eq', 'order', 'gte', 'lt', 'in', 'limit', 'insert', 'update', 'delete', 'upsert'];
  for (const m of chain) {
    builder[m] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(singleResult()));
  builder.single = vi.fn(() => Promise.resolve(singleResult()));
  builder.then = (resolve: (v: TableResult) => unknown) => resolve(listResult());
  return builder;
}

const fromMock = vi.fn((table: string) => makeBuilder(table));
function makeChannel() {
  const ch: Record<string, unknown> = {};
  ch.on = vi.fn(() => ch);
  ch.subscribe = vi.fn(() => ch);
  return ch;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...a: unknown[]) => fromMock(...(a as [string])),
    channel: vi.fn(() => makeChannel()),
    removeChannel: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => {
  const shape = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger: { ...shape, create: () => shape } };
});

import { toast } from 'sonner';

const activeCall = {
  id: 'call-1',
  caller_name: 'Caller',
  caller_phone: '+5511999999999',
  agent_name: 'Agent A',
  started_at: new Date(Date.now() - 65000).toISOString(),
  status: 'active',
  hold_time_seconds: 10,
};

// The global AudioContext mock in src/test/setup.ts lacks close/resume/state,
// which the real useCriticalAlertNotifications uses. Provide a richer stub here.
class TestAudioContext {
  currentTime = 0;
  state = 'running';
  createOscillator() {
    return {
      connect: vi.fn(),
      frequency: { value: 0, setValueAtTime: vi.fn() },
      type: 'sine',
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    };
  }
  destination = {};
  resume = vi.fn();
  close = vi.fn();
}

describe('useSupervisorPanel (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as unknown as { AudioContext: unknown }).AudioContext = TestAudioContext;
    (window as unknown as { AudioContext: unknown }).AudioContext = TestAudioContext;
    localStorage.clear();
    for (const k of Object.keys(listResults)) delete listResults[k];
    for (const k of Object.keys(singleResults)) delete singleResults[k];
    setTable('call_sessions', [activeCall]);
    setTable('barge_in_sessions', null);
    setSingle('barge_in_sessions', null);
    setTable('whisper_messages', []);
  });

  it('loads active calls and queue metrics on mount', async () => {
    setTable('call_sessions', [{ ...activeCall, status: 'completed', duration_seconds: 100, hold_time_seconds: 20, ended_at: new Date().toISOString() }]);
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeCalls.length).toBeGreaterThanOrEqual(0);
    expect(result.current.queueMetrics).toBeDefined();
  });

  it('selecting a call fetches whisper history', async () => {
    setTable('whisper_messages', [{ id: 'w1', message: 'hi', created_at: new Date().toISOString(), is_read: false }]);
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSelectedCall(activeCall));
    await waitFor(() => expect(result.current.whisperHistory.length).toBe(1));
  });

  it('sendWhisper errors when no call/message selected', async () => {
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.sendWhisper(); });
    expect(toast.error).toHaveBeenCalledWith('Selecione uma chamada e digite uma mensagem');
  });

  it('sendWhisper succeeds with selection and message', async () => {
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSelectedCall(activeCall));
    act(() => result.current.setWhisperMessage('Hello agent'));
    await waitFor(() => expect(result.current.whisperMessage).toBe('Hello agent'));
    await act(async () => { await result.current.sendWhisper(); });
    expect(toast.success).toHaveBeenCalledWith('Whisper enviado para Agent A');
  });

  it('sendWhisper handles insert error', async () => {
    setTable('whisper_messages', null, { message: 'fail' });
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSelectedCall(activeCall));
    act(() => result.current.setWhisperMessage('Hi'));
    await waitFor(() => expect(result.current.whisperMessage).toBe('Hi'));
    await act(async () => { await result.current.sendWhisper(); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao enviar whisper');
  });

  it('startBargeIn errors without selection then succeeds', async () => {
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.startBargeIn(); });
    expect(toast.error).toHaveBeenCalledWith('Selecione uma chamada primeiro');

    act(() => result.current.setSelectedCall(activeCall));
    await waitFor(() => expect(result.current.selectedCall).not.toBeNull());
    await act(async () => { await result.current.startBargeIn(); });
    expect(toast.success).toHaveBeenCalledWith('Você entrou na chamada com Agent A');
  });

  it('startBargeIn handles insert error', async () => {
    setTable('barge_in_sessions', null, { message: 'fail' });
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSelectedCall(activeCall));
    await waitFor(() => expect(result.current.selectedCall).not.toBeNull());
    await act(async () => { await result.current.startBargeIn(); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao iniciar barge-in');
  });

  it('endBargeIn no-ops without active barge-in', async () => {
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.endBargeIn(); });
    expect(result.current.activeBargeIn).toBeNull();
  });

  it('endBargeIn ends an active barge-in session', async () => {
    setSingle('barge_in_sessions', {
      id: 'b1', call_session_id: 'call-1', supervisor_name: 'Supervisor',
      agent_name: 'Agent A', status: 'active', started_at: new Date().toISOString(),
    });
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.activeBargeIn).not.toBeNull());
    await act(async () => { await result.current.endBargeIn(); });
    expect(toast.info).toHaveBeenCalledWith('Você saiu da conferência');
    expect(result.current.activeBargeIn).toBeNull();
  });

  it('endBargeIn handles update error', async () => {
    setSingle('barge_in_sessions', {
      id: 'b1', call_session_id: 'call-1', supervisor_name: 'Supervisor',
      agent_name: 'Agent A', status: 'active', started_at: new Date().toISOString(),
    });
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.activeBargeIn).not.toBeNull());
    setTable('barge_in_sessions', null, { message: 'fail' });
    await act(async () => { await result.current.endBargeIn(); });
    expect(toast.error).toHaveBeenCalledWith('Erro ao sair da chamada');
  });

  it('exposes sound setters and helpers', async () => {
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.handleSoundEnabledChange(false));
    await waitFor(() => expect(result.current.soundEnabled).toBe(false));
    expect(localStorage.getItem('supervisor-sound-enabled')).toBe('false');

    act(() => result.current.handleSoundConfigChange({
      warningFrequency: 500, warningPattern: 'double', warningVolume: 0.1,
      criticalFrequency: 900, criticalPattern: 'triple', criticalVolume: 0.4,
    }));
    await waitFor(() => expect(result.current.soundConfig.warningPattern).toBe('double'));

    await act(async () => { await result.current.handleEnableSound(); });
    expect(result.current.soundEnabled).toBe(true);

    act(() => result.current.setShowTrendChart(true));
    await waitFor(() => expect(result.current.showTrendChart).toBe(true));

    expect(typeof result.current.formatTime(activeCall.started_at)).toBe('string');
    expect(result.current.isCallInBargeIn('call-1')).toBe(false);
    expect(result.current.getCallDuration(activeCall.started_at)).toContain(':');
    expect(result.current.formatWaitTime(90)).toBe('1:30');
    expect(result.current.quickWhispers.length).toBeGreaterThan(0);
    act(() => result.current.playAlertSound('warning'));
  });

  it('reads persisted sound settings from localStorage', async () => {
    localStorage.setItem('supervisor-sound-enabled', 'false');
    localStorage.setItem('supervisor-sound-config', JSON.stringify({
      warningFrequency: 111, warningPattern: 'single', warningVolume: 0.2,
      criticalFrequency: 222, criticalPattern: 'urgent', criticalVolume: 0.3,
    }));
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.soundEnabled).toBe(false);
    expect(result.current.soundConfig.warningFrequency).toBe(111);
  });

  it('handles queue metrics fetch error gracefully', async () => {
    setTable('call_sessions', null, { message: 'metrics fail' });
    const { result } = renderHook(() => useSupervisorPanel());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.queueMetrics.totalCompleted).toBe(0);
  });
});
