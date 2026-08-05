import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { insertMock, insertSelectSingleMock, updateEqMock, upsertMock, invokeMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  insertSelectSingleMock: vi.fn(),
  updateEqMock: vi.fn(),
  upsertMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock('@/lib/logger', () => {
  const lvl = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { logger: { create: vi.fn(() => lvl), ...lvl } };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'call_sessions') {
        return {
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: insertSelectSingleMock })) })),
          update: vi.fn(() => ({ eq: updateEqMock })),
        };
      }
      if (table === 'call_transcripts_searchable') {
        return { upsert: upsertMock };
      }
      // call_transcriptions, call_analyses, call_summaries
      return { insert: insertMock };
    }),
    functions: { invoke: invokeMock },
  },
}));

import { useCallSession } from '@/hooks/useCallSession';

beforeEach(() => {
  vi.useFakeTimers();
  insertSelectSingleMock.mockResolvedValue({
    data: { id: 'sess1', caller_name: 'John', caller_phone: '123', agent_name: 'Agent', started_at: '2024-01-01T10:00:00Z' },
    error: null,
  });
  insertMock.mockResolvedValue({ error: null });
  updateEqMock.mockResolvedValue({ error: null });
  upsertMock.mockResolvedValue({ error: null });
  invokeMock.mockResolvedValue({ data: {}, error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

const mkTranscript = (id: string, withTimes = true) => ({
  id, text: `text ${id}`, speaker: 'agent' as const, speakerLabel: 'Agent',
  timestamp: new Date(),
  ...(withTimes ? { startTime: 0, endTime: 5 } : {}),
});

const mkAnalysis = (risk: boolean) => ({
  sentiment: 'positive', urgency: 'low', emotion: 'happy', suggestion: 'go on',
  riskAlert: risk, riskReason: risk ? 'reason' : '', messageAnalyzed: 'msg', speakerRole: 'agent',
});

describe('useCallSession', () => {
  it('starts a session successfully', async () => {
    const { result } = renderHook(() => useCallSession());
    let session: unknown;
    await act(async () => { session = await result.current.startSession('John', '123', 'Agent'); });
    expect((session as { id?: string })?.id).toBe('sess1');
    expect(result.current.currentSession?.callerName).toBe('John');
  });

  it('returns null on start error', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useCallSession());
    let session: unknown = 'x';
    await act(async () => { session = await result.current.startSession('John', '123'); });
    expect(session).toBeNull();
  });

  it('addTranscript/addAnalysis no-op without session', () => {
    const { result } = renderHook(() => useCallSession());
    act(() => result.current.addTranscript(mkTranscript('t1')));
    act(() => result.current.addAnalysis(mkAnalysis(false)));
    expect(result.current.currentSession).toBeNull();
  });

  it('schedules and flushes saves of transcripts and analyses', async () => {
    const { result } = renderHook(() => useCallSession());
    await act(async () => { await result.current.startSession('John', '123', 'Agent'); });

    act(() => {
      result.current.addTranscript(mkTranscript('t1'));
      result.current.addTranscript(mkTranscript('t2', false));
      result.current.addAnalysis(mkAnalysis(true));
      result.current.addAnalysis(mkAnalysis(false));
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(insertMock).toHaveBeenCalled();
  });

  it('handles save errors (requeues)', async () => {
    insertMock.mockResolvedValue({ error: { message: 'save fail' } });
    const { result } = renderHook(() => useCallSession());
    await act(async () => { await result.current.startSession('John', '123'); });
    act(() => { result.current.addTranscript(mkTranscript('t1')); result.current.addAnalysis(mkAnalysis(true)); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    expect(insertMock).toHaveBeenCalled();
  });

  it('ends session with summary and runs post-call intelligence (>=60s)', async () => {
    const { result } = renderHook(() => useCallSession());
    await act(async () => { await result.current.startSession('John', '123', 'Agent'); });
    act(() => { result.current.addTranscript(mkTranscript('t1')); });
    // flush so allTranscriptsRef populated
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });

    await act(async () => {
      await result.current.endSession(120, {
        summary: 'sum', mainTopics: ['a'], overallSentiment: 'positive',
        customerSatisfaction: 90, agentPerformance: 80, nextSteps: ['x'],
      });
    });
    expect(updateEqMock).toHaveBeenCalled();
    expect(upsertMock).toHaveBeenCalled();
    expect(invokeMock).toHaveBeenCalledWith('analyze-talk-ratio', expect.anything());
    expect(invokeMock).toHaveBeenCalledWith('generate-meeting-summary', expect.anything());
    expect(result.current.currentSession).toBeNull();
  });

  it('ends session under 60s without summary, no meeting summary call', async () => {
    const { result } = renderHook(() => useCallSession());
    await act(async () => { await result.current.startSession('John', '123'); });
    act(() => { result.current.addTranscript(mkTranscript('t1', false)); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });

    invokeMock.mockClear();
    await act(async () => { await result.current.endSession(30); });
    expect(invokeMock).not.toHaveBeenCalledWith('generate-meeting-summary', expect.anything());
  });

  it('endSession no-op without session', async () => {
    const { result } = renderHook(() => useCallSession());
    await act(async () => { await result.current.endSession(60); });
    expect(updateEqMock).not.toHaveBeenCalled();
  });

  it('endSession handles update error', async () => {
    const { result } = renderHook(() => useCallSession());
    await act(async () => { await result.current.startSession('John', '123'); });
    updateEqMock.mockResolvedValueOnce({ error: { message: 'update fail' } });
    await act(async () => { await result.current.endSession(60); });
    expect(result.current.currentSession).toBeNull();
  });

  it('runPostCallIntelligence handles upsert error path', async () => {
    upsertMock.mockResolvedValue({ error: { message: 'upsert fail' } });
    const { result } = renderHook(() => useCallSession());
    await act(async () => { await result.current.startSession('John', '123', 'Agent'); });
    act(() => { result.current.addTranscript(mkTranscript('t1')); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2100); });
    await act(async () => { await result.current.endSession(90); });
    expect(result.current.currentSession).toBeNull();
  });
});
