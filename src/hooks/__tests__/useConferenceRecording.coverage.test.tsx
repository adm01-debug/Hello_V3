import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConferenceRecording } from '../useConferenceRecording';
import type { ConferenceCall } from '../useMultiChannelCall';

const startRecording = vi.fn();
const stopAndSaveRecording = vi.fn();
const getRecordings = vi.fn();
const getRecordingUrl = vi.fn();

let recordingState = false;

vi.mock('../useCallRecording', () => ({
  useCallRecording: () => ({
    isRecording: recordingState,
    isSaving: false,
    startRecording: (...a: unknown[]) => (startRecording as (...args: unknown[]) => unknown)(...a),
    stopAndSaveRecording: (...a: unknown[]) => (stopAndSaveRecording as (...args: unknown[]) => unknown)(...a),
    getRecordings: (...a: unknown[]) => (getRecordings as (...args: unknown[]) => unknown)(...a),
    getRecordingUrl: (...a: unknown[]) => (getRecordingUrl as (...args: unknown[]) => unknown)(...a),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { create: () => ({ debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() }) },
}));

function makeConference(overrides: Partial<ConferenceCall> = {}): ConferenceCall {
  return {
    id: 'conf1',
    isActive: true,
    isRecording: true,
    participantIds: ['p1', 'p2'],
    ...overrides,
  } as ConferenceCall;
}

describe('useConferenceRecording (coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recordingState = false;
    startRecording.mockResolvedValue(true);
    stopAndSaveRecording.mockResolvedValue('/path/rec.webm');
    getRecordings.mockResolvedValue([{ id: 'r1' }]);
    getRecordingUrl.mockReturnValue('http://url');
  });

  it('auto-starts recording and fires onRecordingStarted', async () => {
    const onRecordingStarted = vi.fn();
    renderHook(() => useConferenceRecording({ conference: makeConference(), onRecordingStarted }));
    await waitFor(() => expect(startRecording).toHaveBeenCalled());
    await waitFor(() => expect(onRecordingStarted).toHaveBeenCalled());
  });

  it('does not start when conference is null', () => {
    renderHook(() => useConferenceRecording({ conference: null }));
    expect(startRecording).not.toHaveBeenCalled();
  });

  it('saves recording when conference ends and fires onRecordingSaved', async () => {
    const onRecordingSaved = vi.fn();
    const { rerender } = renderHook(
      ({ conf }: { conf: ConferenceCall | null }) =>
        useConferenceRecording({ conference: conf, onRecordingSaved }),
      { initialProps: { conf: makeConference() as ConferenceCall | null } },
    );
    await waitFor(() => expect(startRecording).toHaveBeenCalled());
    rerender({ conf: null });
    await waitFor(() => expect(stopAndSaveRecording).toHaveBeenCalled());
    await waitFor(() => expect(onRecordingSaved).toHaveBeenCalledWith('/path/rec.webm'));
  });

  it('saveConferenceRecording returns null when no conference', async () => {
    const { result } = renderHook(() => useConferenceRecording({ conference: null }));
    let res: string | null = 'x';
    await act(async () => {
      res = await result.current.saveConferenceRecording();
    });
    expect(res).toBeNull();
  });

  it('saveConferenceRecording stops and saves when conference present', async () => {
    const { result } = renderHook(() => useConferenceRecording({ conference: makeConference({ isRecording: false }) }));
    let res: string | null = null;
    await act(async () => {
      res = await result.current.saveConferenceRecording();
    });
    expect(stopAndSaveRecording).toHaveBeenCalled();
    expect(res).toBe('/path/rec.webm');
  });

  it('getConferenceRecordings returns [] when no conference', async () => {
    const { result } = renderHook(() => useConferenceRecording({ conference: null }));
    let res: unknown[] = [{ id: 'x' }];
    await act(async () => {
      res = await result.current.getConferenceRecordings();
    });
    expect(res).toEqual([]);
  });

  it('getConferenceRecordings delegates when conference present', async () => {
    const { result } = renderHook(() => useConferenceRecording({ conference: makeConference({ isRecording: false }) }));
    await act(async () => {
      await result.current.getConferenceRecordings();
    });
    expect(getRecordings).toHaveBeenCalledWith('conf1');
  });

  it('exposes getRecordingUrl passthrough', () => {
    const { result } = renderHook(() => useConferenceRecording({ conference: null }));
    expect(typeof result.current.getRecordingUrl).toBe('function');
  });
});
